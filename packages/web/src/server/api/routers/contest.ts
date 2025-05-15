import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

import { prisma } from "@runner/db";

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
	id: z.string(),
	name: z.string().optional(),
	status: ContestStatus.optional(),
	startDate: z.date().optional(),
	endDate: z.date().optional(),
	createdBy: z.string().optional(),
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
		.mutation(({ ctx, input }) => {
			return prisma.contest.update({
				where: {
					id: input.id,
				},
				data: {
					name: input.name,
					start: input.startDate,
					end: input.endDate,
					CreatedBy: { connect: { id: input.createdBy } },
				},
			});
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
		.input(
			z.object({ contestId: z.string(), problemsIds: z.array(z.string()) }),
		)
		.mutation(({ ctx, input }) => {
			return prisma.contest.update({
				where: {
					id: input.contestId,
				},
				data: {
					Problems: {
						connect: input.problemsIds.map((id) => ({ id })),
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
