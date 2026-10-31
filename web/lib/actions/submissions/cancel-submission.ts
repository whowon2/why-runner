"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/db";
import { submission } from "@/drizzle/schema";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export type CancelSubmissionError = "ALREADY_RUNNING";

/**
 * Withdraws one of the current user's own submissions while it is still
 * PENDING, e.g. when no judge is picking it up. The judge only claims
 * PENDING rows, so a CANCELED one is never judged, and nothing graded
 * (standings, gradebook, statistics, lesson hand-in) counts it. Once the
 * judge has claimed it, it is too late: `ALREADY_RUNNING`.
 */
export async function cancelSubmission(
  rawId: string,
): Promise<
  ActionResult<{ id: string; contestId: string | null }, CancelSubmissionError>
> {
  const currentUser = await getCurrentUser({});
  const id = z.uuid().parse(rawId);

  const [canceled] = await db
    .update(submission)
    .set({ status: "CANCELED" })
    .where(
      and(
        eq(submission.id, id),
        eq(submission.userId, currentUser.id),
        eq(submission.status, "PENDING"),
      ),
    )
    .returning({ id: submission.id, contestId: submission.contestId });
  if (canceled) return ok(canceled);

  const own = await db.query.submission.findFirst({
    where: and(eq(submission.id, id), eq(submission.userId, currentUser.id)),
    columns: { id: true },
  });
  if (!own) throw new Error("Submission not found.");
  return fail("ALREADY_RUNNING");
}
