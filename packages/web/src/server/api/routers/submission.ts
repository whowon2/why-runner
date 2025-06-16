import { env } from "@/env";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { GoogleGenAI } from "@google/genai";
import { Queue } from "bullmq";
import Redis from "ioredis";
import { z } from "zod";

const createSubmissionInput = z.object({
	code: z.string(),
	language: z.enum(["c", "cpp", "java", "python", "rust"]),
	problemId: z.string().uuid(),
});

const redis = new Redis(env.REDIS_URL);

const queue = new Queue("submissions", {
	connection: redis,
	defaultJobOptions: {
		backoff: {
			type: "exponential",
			delay: 1000,
		},
	},
});

export const submissionRouter = createTRPCRouter({
	create: protectedProcedure
		.input(createSubmissionInput)
		.mutation(async ({ ctx, input }) => {
			const submission = await ctx.db.submission.create({ data: input });

			const item = await queue.add("processSubmission", {
				submissionId: submission.id,
			});

			console.log("queue item", item);

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
