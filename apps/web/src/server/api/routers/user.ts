import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { hash } from "bcrypt";
import { prisma } from "@repo/db";
import { updateProfileSchema } from "@/lib/schemas";

export const userRouter = createTRPCRouter({
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
