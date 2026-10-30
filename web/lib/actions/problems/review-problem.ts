"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/db";
import { problem } from "@/drizzle/schema";
import { generateJson } from "@/lib/ai";
import { type ActionResult, ok } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { ownerOrAdminFilter } from "@/lib/auth/permissions";
import {
  getProblemReviewPrompt,
  SYSTEM_INSTRUCTION_PROBLEM_REVIEW,
} from "@/lib/prompt";
import { consumeAiQuota } from "@/lib/rate-limit";

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

export async function reviewProblem(
  problemId: string,
): Promise<ActionResult<ProblemReview, "RATE_LIMITED">> {
  const currentUser = await getCurrentUser({});
  // Creator or admin.
  const ownerFilter = await ownerOrAdminFilter(
    problem.createdBy,
    currentUser.id,
  );

  const found = await db.query.problem.findFirst({
    where: and(eq(problem.id, problemId), ownerFilter),
  });

  if (!found) throw new Error("Problem not found.");

  const quota = await consumeAiQuota(currentUser.id, "problem-review");
  if (!quota.ok) return quota;

  return ok(
    await generateJson("problem-review", {
      system: SYSTEM_INSTRUCTION_PROBLEM_REVIEW,
      prompt: getProblemReviewPrompt({ problem: found }),
      schema: ReviewSchema,
    }),
  );
}
