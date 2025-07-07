import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { GoogleGenAI } from '@google/genai';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { env } from '@/env';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

const createSubmissionInput = z.object({
	code: z.string(),
	contestId: z.string().uuid(),
	language: z.enum(['c', 'cpp', 'java', 'python', 'rust']),
	problemId: z.string().uuid(),
	questionLetter: z.string(),
});

const sqs = new SQSClient({
	region: env.AWS_REGION,
	credentials: {
		accessKeyId: env.AWS_ACCESS_KEY_ID,
		secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
	},
});

export const submissionRouter = createTRPCRouter({
	create: protectedProcedure
		.input(createSubmissionInput)
		.mutation(async ({ ctx, input }) => {
			// check if the user already submitted a valid solution
			const uoc = await ctx.db.userOnContest.findFirst({
				where: {
					userId: ctx.session.user.id,
					contestId: input.contestId,
				},
			});

			if (!uoc) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'User is not registered for this contest',
				});
			}

			if (uoc.answers.includes(input.questionLetter)) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Você já enviou uma solução válida para esta questão',
				});
			}

			const submission = await ctx.db.submission.create({
				data: {
					code: input.code,
					problemId: input.problemId,
					language: input.language,
					contestId: input.contestId,
					userId: ctx.session.user.id,
				},
			});

			const message = {
				submissionId: submission.id,
				questionLetter: input.questionLetter,
			};

			await sqs.send(
				new SendMessageCommand({
					QueueUrl: env.SQS_QUEUE_URL,
					MessageBody: JSON.stringify(message),
					DelaySeconds: 10,
				}),
			);

			console.log('queue item', message);

			return submission;
		}),

	find: protectedProcedure
		.input(
			z.object({
				problemId: z.string(),
			}),
		)
		.query(({ ctx, input }) => {
			return ctx.db.submission.findMany({
				where: {
					problemId: input.problemId,
				},
				orderBy: {
					createdAt: 'desc',
				},
			});
		}),

	findOne: protectedProcedure.input(z.string()).query(({ ctx, input }) => {
		return ctx.db.submission.findUnique({
			where: {
				id: input,
			},
		});
	}),

	getAiHelp: protectedProcedure
		.input(
			z.object({
				locale: z.string().default('en'),
				problem: z.object({
					id: z.string().uuid(),
					title: z.string(),
					description: z.string(),
					inputs: z.array(z.string()),
					outputs: z.array(z.string()),
				}),
				submission: z.object({
					id: z.string().uuid(),
					language: z.string(),
					code: z.string(),
					output: z.string().nullish(),
					status: z.string(),
				}),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const prompt = `
You are a programming assistant that helps students learn what went wrong in the submission of a competitive programming problem.
If the submission failed, help the student understand why their output is wrong without giving the direct answer, be vague. Give hints or explain mistakes. Make it in the least amount of words as possible.
If success, help on how to improve the code, suggest different data structures, algorithms, etc.
Return in the language of the locale: ${input.locale}.

Problem:
${input.problem.title}
${input.problem.description}

Inputs:
${input.problem.inputs.join('\n')}

Expected Outputs:
${input.problem.outputs.join('\n')}

Student Code in ${input.submission.language}:
${input.submission.code}
${input.submission.status}

The student code produces this output:
${input.submission.output}

`;

			console.log(prompt);

			const ai = new GoogleGenAI({ apiKey: env.GEMINI_KEY });

			const response = await ai.models.generateContent({
				model: 'gemini-2.0-flash',
				contents: prompt,
			});

			return response.text;
		}),
});
