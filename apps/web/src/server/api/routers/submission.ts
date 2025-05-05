import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

import { Language, prisma } from "@repo/db";
import { env } from "@/env";

const createSubmissionInput = z.object({
  code: z.string(),
  language: z.enum(["c", "cpp", "java", "python", "rust"]),
  problemId: z.string().uuid(),
});

export const SubmissionRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createSubmissionInput)
    .mutation(async ({ ctx, input }) => {
      const res = await fetch(`${env.BACKEND_URL}/submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      return await res.json();
    }),

  find: protectedProcedure.query(({ ctx, input }) => {
    return prisma.submission.findMany({});
  }),

  findOne: protectedProcedure.input(z.string()).query(({ ctx, input }) => {
    return prisma.submission.findUnique({
      where: {
        id: input,
      },
    });
  }),
});
