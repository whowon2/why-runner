"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/db";
import { AI_ASSISTANCE_LEVELS, contest } from "@/drizzle/schema";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isContestLocked } from "@/lib/contest/editable";
import { generateSlug } from "@/lib/slug";

// The only fields an owner may write through this action. Status changes go
// through publishContest; id/slug/createdBy are server-owned.
const updateContestSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
  isPrivate: z.boolean().optional(),
  aiAssistance: z.enum(AI_ASSISTANCE_LEVELS).optional(),
});

export type UpdateContestInput = {
  contestId: string;
  contest: z.input<typeof updateContestSchema>;
};

const sameMinute = (a: Date | null, b: Date | null) =>
  a === b ||
  (a !== null &&
    b !== null &&
    Math.floor(a.getTime() / 60_000) === Math.floor(b.getTime() / 60_000));

export async function updateContest(
  input: UpdateContestInput,
): Promise<
  ActionResult<typeof contest.$inferSelect | undefined, "CONTEST_STARTED">
> {
  const currentUser = await getCurrentUser({});

  const existing = await db.query.contest.findFirst({
    where: and(
      eq(contest.id, input.contestId),
      eq(contest.createdBy, currentUser.id),
    ),
    columns: { name: true, status: true, startDate: true, endDate: true },
  });

  if (!existing) throw new Error("Contest not found.");

  const parsed = updateContestSchema.safeParse(input.contest);
  if (!parsed.success) throw new Error("Invalid contest data.");

  const values: Partial<typeof contest.$inferInsert> = { ...parsed.data };
  if (values.name && values.name !== existing.name) {
    values.slug = generateSlug(values.name);
  }

  // Once a published contest starts, only its dates are frozen here (the
  // problem list is guarded by the add/remove/reorder actions). The settings
  // form always resends both dates, so only an actual change is rejected.
  const datesChanged =
    (values.startDate !== undefined &&
      !sameMinute(values.startDate, existing.startDate)) ||
    (values.endDate !== undefined &&
      !sameMinute(values.endDate, existing.endDate));
  if (datesChanged && isContestLocked(existing)) {
    return fail("CONTEST_STARTED");
  }

  const nextStartDate =
    values.startDate !== undefined ? values.startDate : existing.startDate;
  const nextEndDate =
    values.endDate !== undefined ? values.endDate : existing.endDate;
  if (nextStartDate && nextEndDate && nextEndDate <= nextStartDate) {
    throw new Error("End date must be after start date.");
  }

  const [result] = await db
    .update(contest)
    .set(values)
    .where(
      and(
        eq(contest.id, input.contestId),
        eq(contest.createdBy, currentUser.id),
      ),
    )
    .returning();

  return ok(result);
}
