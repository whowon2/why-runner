"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/db";
import { codeRun } from "@/drizzle/schema";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export type CancelRunError = "ALREADY_RUNNING";

/**
 * Withdraws one of the current user's own runs while it is still PENDING.
 * The judge only claims PENDING runs, and `createRun`'s one-in-flight check
 * only looks at PENDING/RUNNING, so a new run can start right away. Once the
 * judge has claimed it, it is too late: `ALREADY_RUNNING`.
 */
export async function cancelRun(
  rawId: string,
): Promise<ActionResult<{ id: string }, CancelRunError>> {
  const currentUser = await getCurrentUser({});
  const id = z.uuid().parse(rawId);

  const [canceled] = await db
    .update(codeRun)
    .set({ status: "CANCELED" })
    .where(
      and(
        eq(codeRun.id, id),
        eq(codeRun.userId, currentUser.id),
        eq(codeRun.status, "PENDING"),
      ),
    )
    .returning({ id: codeRun.id });
  if (canceled) return ok(canceled);

  const own = await db.query.codeRun.findFirst({
    where: and(eq(codeRun.id, id), eq(codeRun.userId, currentUser.id)),
    columns: { id: true },
  });
  if (!own) throw new Error("Run not found.");
  return fail("ALREADY_RUNNING");
}
