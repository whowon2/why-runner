"use server";

import { and, asc, count, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/db";
import {
  contest,
  problemOnContest,
  submission,
  userOnContest,
} from "@/drizzle/schema";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { notifyJudge } from "@/lib/judge";
import { letters } from "@/lib/letters";
import { languageSchema, MAX_CODE_LENGTH } from "@/lib/submission-limits";

const RATE_LIMIT_WINDOW_SECS = 30;
const RATE_LIMIT_MAX = 5;

// Only these fields come from the client. Everything else on the row
// (status, userId, questionLetter, codeSize, …) is decided here.
const inputSchema = z.object({
  contestId: z.string().min(1),
  problemId: z.string().min(1),
  code: z.string().min(1),
  language: languageSchema,
});

export type CreateContestSubmissionInput = z.infer<typeof inputSchema>;

export type CreateContestSubmissionError =
  | "RATE_LIMITED"
  | "CODE_TOO_LARGE"
  | "CONTEST_NOT_STARTED";

export async function createSubmission(
  rawInput: CreateContestSubmissionInput,
): Promise<ActionResult<void, CreateContestSubmissionError>> {
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

  const found = await db.query.contest.findFirst({
    where: eq(contest.id, input.contestId),
    columns: { status: true, startDate: true },
  });
  if (!found || found.status !== "published") {
    throw new Error("Contest not found.");
  }
  if (found.startDate && new Date() < found.startDate) {
    return fail("CONTEST_NOT_STARTED");
  }

  const userProgress = await db.query.userOnContest.findFirst({
    where: and(
      eq(userOnContest.userId, currentUser.id),
      eq(userOnContest.contestId, input.contestId),
    ),
  });

  if (!userProgress)
    throw new Error("You are not a participant in this contest.");
  if (userProgress.joinStatus === "pending")
    throw new Error("Your join request is still pending approval.");

  // Letter = position in the order-sorted problem list, exactly as the
  // standings and the contest UI compute it (`order` itself may have gaps
  // after removals).
  const attached = await db
    .select({ problemId: problemOnContest.problemId })
    .from(problemOnContest)
    .where(eq(problemOnContest.contestId, input.contestId))
    .orderBy(asc(problemOnContest.order));
  const index = attached.findIndex((p) => p.problemId === input.problemId);
  if (index === -1) throw new Error("Problem not found.");

  const questionLetter = letters[index] ?? String(index + 1);

  if (userProgress.answered.includes(questionLetter)) {
    throw new Error("You have already answered this question correctly.");
  }

  const [sub] = await db
    .insert(submission)
    .values({
      code: input.code,
      language: input.language,
      problemId: input.problemId,
      contestId: input.contestId,
      questionLetter,
      userId: currentUser.id,
      codeSize: input.code.length,
    })
    .returning({ id: submission.id });

  await notifyJudge("new_submission", sub.id);

  return ok(undefined);
}
