import {
	DeleteMessageCommand,
	ReceiveMessageCommand,
	SendMessageCommand,
	SQSClient,
} from "@aws-sdk/client-sqs";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { env } from "@/env";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

const createSubmissionInput = z.object({
	code: z.string(),
	language: z.enum(["c", "cpp", "java", "python", "rust"]),
	problemId: z.string().uuid(),
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
			const submission = await ctx.db.submission.create({ data: input });

			const message = {
				submissionId: submission.id,
			};

			await sqs.send(
				new SendMessageCommand({
					QueueUrl: env.SQS_QUEUE_URL,
					MessageBody: JSON.stringify(message),
				}),
			);

			console.log("queue item", message);

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
					createdAt: "desc",
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

Problem:
${input.problem.title}
${input.problem.description}

Inputs:
${input.problem.inputs.join("\n")}

Expected Outputs:
${input.problem.outputs.join("\n")}

Student Code in ${input.submission.language}:
${input.submission.code}
${input.submission.status}

The student code produces this output:
${input.submission.output}

`;

			console.log(prompt);

			const ai = new GoogleGenAI({ apiKey: env.GEMINI_KEY });

			const response = await ai.models.generateContent({
				model: "gemini-2.0-flash",
				contents: prompt,
			});

			return response.text;
		}),
});
