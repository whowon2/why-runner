import { Queue } from "bullmq";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

import { env } from "@/env";
import Redis from "ioredis";

const createSubmissionInput = z.object({
	code: z.string(),
	language: z.enum(["c", "cpp", "java", "python", "rust"]),
	problemId: z.string().uuid(),
});

const connection = new Redis(env.REDIS_URL);

const queue = new Queue("submissions", {
	connection,
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
				where: {},
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
});
