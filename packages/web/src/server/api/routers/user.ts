import { z } from 'zod';
import { env } from '@/env';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';

export const updateProfileSchema = z.object({
	image: z.union([z.string().url(), z.literal('')]),
	name: z.string(),
});

export const userRouter = createTRPCRouter({
	get: protectedProcedure.query(async ({ ctx }) => {
		return await ctx.db.user.findUnique({
			where: { id: ctx.session.user.id },
		});
	}),

	update: protectedProcedure
		.input(updateProfileSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.user.update({
				data: {
					image: input.image,
					name: input.name,
				},
				where: { id: ctx.session.user.id },
			});
		}),
});
