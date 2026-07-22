"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { contest } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { generateSlug } from "@/lib/slug";
import type { UpdateContestInput } from "@/hooks/use-update-contest";

export async function updateContest(input: UpdateContestInput) {
  const currentUser = await getCurrentUser({});

  const values = { ...input.contest };
  if (values.name) {
    values.slug = generateSlug(values.name);
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
