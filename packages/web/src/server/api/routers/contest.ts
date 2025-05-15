import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

import { prisma } from "@runner/db";
import { TRPCError } from "@trpc/server";

const ContestStatus = z.enum([
	"UNPUBLISHED",
	"UPCOMING",
	"ACTIVE",
	"COMPLETED",
	"CANCELLED",
]);

const createContestInput = z.object({
	name: z.string(),
	startDate: z.date(),
	endDate: z.date(),
});

const updateContestInput = z.object({
	contestId: z.string(),
	name: z.string().optional(),
	status: ContestStatus.optional(),
	start: z.date().optional(),
	end: z.date().optional(),
});

export const contestRouter = createTRPCRouter({
	create: protectedProcedure
		.input(createContestInput)
		.mutation(async ({ ctx, input }) => {
			return await prisma.contest.create({
				data: {
					name: input.name,
					start: input.startDate,
					end: input.endDate,
					CreatedBy: {
						connect: {
							id: ctx.session.user.id,
						},
					},
				},
			});
		}),

	findAll: protectedProcedure.query(({ ctx, input }) => {
		return prisma.contest.findMany({
			include: { UserOnContest: true },
		});
	}),

	findById: protectedProcedure.input(z.string()).query(({ ctx, input }) => {
		return prisma.contest.findUnique({
			where: {
				id: input,
			},
			include: {
				Problems: true,
				UserOnContest: true,
			},
		});
	}),

	update: protectedProcedure
		.input(updateContestInput)
		.mutation(async ({ ctx, input }) => {
			console.log({ input });
			const updated = await prisma.contest.update({
				where: {
					id: input.contestId,
				},
				data: {
					name: input.name,
					start: input.start,
					end: input.end,
				},
			});

			console.log(updated);

			return updated;
		}),

	delete: protectedProcedure
		.input(
			z.object({
				contestId: z.string(),
			}),
		)
		.mutation(({ ctx, input }) => {
			return prisma.contest.delete({
				where: {
					id: input.contestId,
				},
			});
		}),

	addProblems: protectedProcedure
		.input(z.object({ contestId: z.string(), problemId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const contest = await prisma.contest.findUnique({
				where: { id: input.contestId },
				include: {
					Problems: true,
				},
			});

			if (!contest) {
				return new TRPCError({
					message: "Contest does not exist!",
					code: "CONFLICT",
				});
			}

			const problem = contest.Problems.find((p) => p.id === input.problemId);

			if (problem) {
				throw new Error("Problem already in the contest!");
			}

			return prisma.contest.update({
				where: {
					id: input.contestId,
				},
				data: {
					Problems: {
						connect: {
							id: input.problemId,
						},
					},
				},
			});
		}),

	removeProblem: protectedProcedure
		.input(z.object({ contestId: z.string(), problemId: z.string() }))
		.mutation(({ ctx, input }) => {
			return prisma.contest.update({
				where: {
					id: input.contestId,
				},
				data: {
					Problems: {
						disconnect: { id: input.problemId },
					},
				},
			});
		}),

	join: protectedProcedure
		.input(z.object({ contestId: z.string() }))
		.mutation(({ ctx, input }) => {
			return prisma.userOnContest.create({
				data: {
					userId: ctx.session.user.id,
					contestId: input.contestId,
				},
			});
		}),

	leave: protectedProcedure
		.input(z.object({ contestId: z.string() }))
		.mutation(({ ctx, input }) => {
			return prisma.userOnContest.delete({
				where: {
					userId_contestId: {
						userId: ctx.session.user.id,
						contestId: input.contestId,
					},
				},
			});
		}),
});
