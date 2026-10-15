"use server";

import { and, count, eq, gte, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/db";
import { problem, submission } from "@/drizzle/schema";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { notifyJudge } from "@/lib/judge";
import { languageSchema, MAX_CODE_LENGTH } from "@/lib/submission-limits";

const RATE_LIMIT_WINDOW_SECS = 30;
const RATE_LIMIT_MAX = 5;

const inputSchema = z.object({
  code: z.string().min(1),
  language: languageSchema,
  problemId: z.string().min(1),
});

export type CreateProblemSubmissionInput = z.infer<typeof inputSchema>;

export async function createProblemSubmission(
  rawInput: CreateProblemSubmissionInput,
): Promise<ActionResult<void, "RATE_LIMITED" | "CODE_TOO_LARGE">> {
  const currentUser = await getCurrentUser({});
  const input = inputSchema.parse(rawInput);

  if (input.code.length > MAX_CODE_LENGTH) {
    return fail("CODE_TOO_LARGE", { max: MAX_CODE_LENGTH });
  }

  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_SECS * 1000);
  const [{ value: recentCount }] = await db
    .select({ value: count() })
    .from(submission)
    .where(
      and(
        eq(submission.userId, currentUser.id),
        gte(submission.createdAt, windowStart),
      ),
    );

  if (recentCount >= RATE_LIMIT_MAX) {
    return fail("RATE_LIMITED", { seconds: RATE_LIMIT_WINDOW_SECS });
  }

  // Same visibility rule as the problem page: published, or your own draft.
  const visible = await db.query.problem.findFirst({
    where: and(
      eq(problem.id, input.problemId),
      or(
        eq(problem.status, "published"),
        eq(problem.createdBy, currentUser.id),
      ),
    ),
    columns: { id: true },
  });
  if (!visible) throw new Error("Problem not found.");

  const [sub] = await db
    .insert(submission)
    .values({
      code: input.code,
      language: input.language,
      problemId: input.problemId,
      contestId: null,
      userId: currentUser.id,
      codeSize: input.code.length,
    })
    .returning({ id: submission.id });

  await notifyJudge("new_submission", sub.id);

  return ok(undefined);
}
