import { env } from "@/env";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import Redis from "ioredis";
import { z } from "zod";

const createSubmissionInput = z.object({
  code: z.string(),
  language: z.enum(["c", "cpp", "java", "python", "rust"]),
  problemId: z.string().uuid(),
});

const redis = new Redis(env.REDIS_URL);

async function addSubmissionJob(data: { submissionId: string }) {
  await redis.lpush("submissions", JSON.stringify(data));
}

export const submissionRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createSubmissionInput)
    .mutation(async ({ ctx, input }) => {
      const submission = await ctx.db.submission.create({ data: input });

      await addSubmissionJob({ submissionId: submission.id });

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
        where: {
          problemId: input.problemId,
        },
        orderBy: {
          createdAt: "desc",
        },
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
