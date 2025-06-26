import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

const createProblemInput = z.object({
	description: z.string(),
	difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
	inputs: z.array(z.string()),
	outputs: z.array(z.string()),
	title: z.string(),
});

export const problemRouter = createTRPCRouter({
	create: protectedProcedure
		.input(createProblemInput)
		.mutation(({ ctx, input }) => {
			return ctx.db.problem.create({
				data: { ...input, userId: ctx.session.user.id },
			});
		}),

	findOne: protectedProcedure.input(z.string()).query(({ ctx, input }) => {
		return ctx.db.problem.findUnique({
			include: {
				submissions: true,
			},
			where: { id: input },
		});
	}),

	getAll: protectedProcedure.query(({ ctx }) => {
		return ctx.db.problem.findMany({
			where: {
				OR: [
					{
						userId: ctx.session.user.id,
					},
					{
						public: true,
					},
				],
			},
		});
	}),
});
