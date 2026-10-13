"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/db";
import { problem } from "@/drizzle/schema";
import { generateJson } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getProblemReviewPrompt,
  SYSTEM_INSTRUCTION_PROBLEM_REVIEW,
} from "@/lib/prompt";

const ReviewSchema = z.object({
  descriptionFeedback: z.string(),
  edgeCases: z.array(
    z.object({
      input: z.string(),
      output: z.string(),
      rationale: z.string(),
    }),
  ),
});

export type ProblemReview = z.infer<typeof ReviewSchema>;
export type ProblemReviewEdgeCase = ProblemReview["edgeCases"][number];

export async function reviewProblem(problemId: string): Promise<ProblemReview> {
  const currentUser = await getCurrentUser({});

  const found = await db.query.problem.findFirst({
    where: and(
      eq(problem.id, problemId),
      eq(problem.createdBy, currentUser.id),
    ),
  });

  if (!found) throw new Error("Problem not found.");

  return generateJson("problem-review", {
    system: SYSTEM_INSTRUCTION_PROBLEM_REVIEW,
    prompt: getProblemReviewPrompt({ problem: found }),
    schema: ReviewSchema,
  });
}
