import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

import { env } from "@/env";

const createSubmissionInput = z.object({
  code: z.string(),
  language: z.enum(["c", "cpp", "java", "python", "rust"]),
  problemId: z.string().uuid(),
});

export const submissionRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createSubmissionInput)
    .mutation(async ({ ctx, input }) => {
      const submission = await ctx.db.submission.create({ data: input });

      return submission;
    }),

  find: protectedProcedure
    .input(
      z.object({
        problemId: z.string(),
      }),
    )
    .query(({ ctx, input }) => {
      return ctx.db.submission.findMany({
        where: {},
      });
    }),

  findOne: protectedProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.db.submission.findUnique({
      where: {
        id: input,
      },
    });
  }),
});
