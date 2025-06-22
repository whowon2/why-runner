import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

const ContestStatus = z.enum([
	'UNPUBLISHED',
	'UPCOMING',
	'ACTIVE',
	'COMPLETED',
	'CANCELLED',
]);

const createContestInput = z.object({
	endDate: z.date(),
	name: z.string(),
	startDate: z.date(),
});

const updateContestInput = z.object({
	contestId: z.string(),
	createdBy: z.string().optional(),
	endDate: z.date().optional(),
	name: z.string().optional(),
	startDate: z.date().optional(),
	status: ContestStatus.optional(),
});

export const contestRouter = createTRPCRouter({
	addProblems: protectedProcedure
		.input(z.object({ contestId: z.string(), problemId: z.string() }))
		.mutation(({ ctx, input }) => {
			return ctx.db.contest.update({
				data: {
					problems: {
						connect: {
							id: input.problemId,
						},
					},
				},
				where: {
					id: input.contestId,
				},
			});
		}),
	create: protectedProcedure
		.input(createContestInput)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.contest.create({
				data: {
					createdBy: {
						connect: {
							id: ctx.session.user.id,
						},
					},
					end: input.endDate,
					name: input.name,
					start: input.startDate,
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

	findAll: protectedProcedure.query(({ ctx, input }) => {
		return ctx.db.contest.findMany({
			include: { userOnContest: true },
		});
	}),

	findById: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			const contest = await ctx.db.contest.findUnique({
				include: {
					problems: true,
					userOnContest: true,
				},
				where: {
					id: input,
				},
			});

			return contest;
		}),

	getLeaderboard: protectedProcedure
		.input(z.object({ contestId: z.string() }))
		.query(({ ctx, input }) => {
			return ctx.db.userOnContest.findMany({
				include: {
					user: true,
				},
				orderBy: {
					score: 'desc',
				},
				where: {
					contestId: input.contestId,
				},
			});
		}),

	join: protectedProcedure
		.input(z.object({ contestId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const isUserOnContest = await ctx.db.userOnContest.findFirst({
				where: {
					contestId: input.contestId,
					userId: ctx.session.user.id,
				},
			});

			if (isUserOnContest) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'User is already on the contest',
				});
			}

			const contest = await ctx.db.contest.findUnique({
				where: {
					id: input.contestId,
				},
			});

			if (!contest || contest.start < new Date()) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Contest has not started yet',
				});
			}

			return ctx.db.userOnContest.create({
				data: {
					contestId: input.contestId,
					userId: ctx.session.user.id,
				},
			});
		}),

	leave: protectedProcedure
		.input(z.object({ contestId: z.string() }))
		.mutation(({ ctx, input }) => {
			return ctx.db.userOnContest.delete({
				where: {
					userId_contestId: {
						contestId: input.contestId,
						userId: ctx.session.user.id,
					},
				},
			});
		}),

	removeProblem: protectedProcedure
		.input(z.object({ contestId: z.string(), problemId: z.string() }))
		.mutation(({ ctx, input }) => {
			return ctx.db.contest.update({
				data: {
					problems: {
						disconnect: { id: input.problemId },
					},
				},
				where: {
					id: input.contestId,
				},
			});
		}),

	update: protectedProcedure
		.input(updateContestInput)
		.mutation(({ ctx, input }) => {
			return ctx.db.contest.update({
				data: {
					end: input.endDate,
					name: input.name,
					start: input.startDate,
				},
				where: {
					id: input.contestId,
				},
			});
		}),
});
