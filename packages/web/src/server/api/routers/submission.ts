import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

import { env } from "@/env";
import { prisma } from "@runner/db";

const createSubmissionInput = z.object({
	code: z.string(),
	language: z.enum(["c", "cpp", "java", "python", "rust"]),
	problemId: z.string().uuid(),
});

export const submissionRouter = createTRPCRouter({
	create: protectedProcedure
		.input(createSubmissionInput)
		.mutation(async ({ ctx, input }) => {
			const res = await fetch(`${env.BACKEND_URL}/api/submissions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(input),
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error);
			}

			return await res.json();
		}),

	find: protectedProcedure
		.input(
			z.object({
				problemId: z.string(),
			}),
		)
		.query(({ ctx, input }) => {
			return prisma.submission.findMany({
				where: {},
			});
		}),

	findOne: protectedProcedure.input(z.string()).query(({ ctx, input }) => {
		return prisma.submission.findUnique({
			where: {
				id: input,
			},
		});
	}),
});
