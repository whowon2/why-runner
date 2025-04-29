import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { hash } from "bcrypt";
import { prisma } from "@repo/db";

const loginInput = z.object({
  email: z.string(),
  password: z.string(),
});

export const userRouter = createTRPCRouter({
  update: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        image: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.log(ctx.session.user);

      return await prisma.user.update({
        where: { id: ctx.session.user.id },
        data: {
          name: input.name,
          image: input.image,
        },
      });
    }),
});
