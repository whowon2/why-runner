import { env } from "@/env";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const updateProfileSchema = z.object({
	name: z.string(),
	image: z.union([z.string().url(), z.literal("")]),
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
				where: { id: ctx.session.user.id },
				data: {
					name: input.name,
					image: input.image,
				},
			});
		}),
});
