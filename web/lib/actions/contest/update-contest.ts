"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { contest } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { generateSlug } from "@/lib/slug";
import type { UpdateContestInput } from "@/hooks/use-update-contest";

export async function updateContest(input: UpdateContestInput) {
  const currentUser = await getCurrentUser({});

  const existing = await db.query.contest.findFirst({
    where: and(
      eq(contest.id, input.contestId),
      eq(contest.createdBy, currentUser.id),
    ),
    columns: { name: true, startDate: true, endDate: true },
  });

  if (!existing) throw new Error("Contest not found.");

  const values = { ...input.contest };
  if (values.name && values.name !== existing.name) {
    values.slug = generateSlug(values.name);
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

  return result;
}
