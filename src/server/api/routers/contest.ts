import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

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
	startDate: z.date().optional(),
	endDate: z.date().optional(),
	createdBy: z.string().optional(),
});

export const contestRouter = createTRPCRouter({
	create: protectedProcedure
		.input(createContestInput)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.contest.create({
				data: {
					name: input.name,
					start: input.startDate,
					end: input.endDate,
					createdBy: {
						connect: {
							id: ctx.session.user.id,
						},
					},
				},
			});
		}),

	findAll: protectedProcedure.query(({ ctx, input }) => {
		return ctx.db.contest.findMany({
			include: { userOnContest: true },
		});
	}),

	findById: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			const contest = await ctx.db.contest.findUnique({
				where: {
					id: input,
				},
				include: {
					problems: true,
					userOnContest: true,
				},
			});

			return contest;
		}),

	update: protectedProcedure
		.input(updateContestInput)
		.mutation(({ ctx, input }) => {
			return ctx.db.contest.update({
				where: {
					id: input.contestId,
				},
				data: {
					name: input.name,
					start: input.startDate,
					end: input.endDate,
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
			return ctx.db.contest.delete({
				where: {
					id: input.contestId,
				},
			});
		}),

	addProblems: protectedProcedure
		.input(z.object({ contestId: z.string(), problemId: z.string() }))
		.mutation(({ ctx, input }) => {
			return ctx.db.contest.update({
				where: {
					id: input.contestId,
				},
				data: {
					problems: {
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
			return ctx.db.contest.update({
				where: {
					id: input.contestId,
				},
				data: {
					problems: {
						disconnect: { id: input.problemId },
					},
				},
			});
		}),

	join: protectedProcedure
		.input(z.object({ contestId: z.string() }))
		.mutation(({ ctx, input }) => {
			return ctx.db.userOnContest.create({
				data: {
					userId: ctx.session.user.id,
					contestId: input.contestId,
				},
			});
		}),

	leave: protectedProcedure
		.input(z.object({ contestId: z.string() }))
		.mutation(({ ctx, input }) => {
			return ctx.db.userOnContest.delete({
				where: {
					userId_contestId: {
						userId: ctx.session.user.id,
						contestId: input.contestId,
					},
				},
			});
		}),
});
