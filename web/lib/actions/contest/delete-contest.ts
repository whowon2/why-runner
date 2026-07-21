"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { contest } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function deleteContest(contestId: string) {
  const currentUser = await getCurrentUser({});

  const found = await db.query.contest.findFirst({
    where: eq(contest.id, contestId),
    columns: { createdBy: true, startDate: true },
  });

  if (!found) throw new Error("Contest not found.");
  if (found.createdBy !== currentUser.id) throw new Error("Forbidden");
  if (new Date() >= found.startDate) throw new Error("Contest has already started.");

  await db.delete(contest).where(eq(contest.id, contestId));
}
