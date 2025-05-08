import { signinSchema, signupSchema, updateProfileSchema } from "@/lib/schemas";
import { prisma } from "@repo/db";
import { hash } from "bcrypt";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { env } from "@/env";

export const userRouter = createTRPCRouter({

  signup: publicProcedure.input(signupSchema).mutation(async ({ ctx, input }) => {
    return await fetch(`${env.BACKEND_URL}/api/auth/signup`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(input),
		});
  }),

  signin: publicProcedure.input(signinSchema).mutation(async ({ ctx, input }) => {
    return await fetch(`${env.BACKEND_URL}/api/auth/signin`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(input),
		});
  }),

	get: protectedProcedure
		.input(
			z.object({
				userId: z.string().uuid(),
			}),
		)
		.query(async ({ ctx, input }) => {
			return await prisma.user.findUnique({
				where: { id: ctx.session.user.id },
			});
		}),

	update: protectedProcedure
		.input(updateProfileSchema)
		.mutation(async ({ ctx, input }) => {
			return await prisma.user.update({
				where: { id: ctx.session.user.id },
				data: {
					name: input.name,
					image: input.image,
				},
			});
		}),
});
