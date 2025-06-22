import { GoogleGenAI } from '@google/genai';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { z } from 'zod';
import { env } from '@/env';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

const createSubmissionInput = z.object({
	code: z.string(),
	contestId: z.string().uuid(),
	language: z.enum(['c', 'cpp', 'java', 'python', 'rust']),
	problemId: z.string().uuid(),
});

const redis = new Redis(env.REDIS_URL);

const queue = new Queue('submissions', {
	connection: redis,
	defaultJobOptions: {
		backoff: {
			delay: 1000,
			type: 'exponential',
		},
	},
});

export const submissionRouter = createTRPCRouter({
	create: protectedProcedure
		.input(createSubmissionInput)
		.mutation(async ({ ctx, input }) => {
			const submission = await ctx.db.submission.create({
				data: { ...input, userId: ctx.session.user.id },
			});

			const item = await queue.add('processSubmission', {
				submissionId: submission.id,
			});

			console.log('queue item', item);

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
				orderBy: {
					createdAt: 'desc',
				},
				where: {
					problemId: input.problemId,
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
				problem: z.object({
					description: z.string(),
					id: z.string().uuid(),
					inputs: z.array(z.string()),
					outputs: z.array(z.string()),
					title: z.string(),
				}),
				submission: z.object({
					code: z.string(),
					id: z.string().uuid(),
					language: z.string(),
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
				contents: prompt,
				model: 'gemini-2.0-flash',
			});

			return response.text;
		}),
});
