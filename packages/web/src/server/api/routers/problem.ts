import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

const findProblemInput = z.object({
	sortBy: z.enum(['name', 'difficulty', 'created']).optional(),
	sortOrder: z.enum(['asc', 'desc']).optional(),
});

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
				data: input,
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
	getAll: protectedProcedure.input(findProblemInput).query(({ ctx, input }) => {
		return ctx.db.problem.findMany({});
	}),
});
