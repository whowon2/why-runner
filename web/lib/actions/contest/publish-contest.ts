"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { contest } from "@/drizzle/schema";
import { fail, ok } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  PUBLISH_MISSING_FIELDS,
  type PublishContestFieldError,
} from "./publish-contest-shared";

export async function publishContest(contestId: string) {
  const currentUser = await getCurrentUser({});

  const found = await db.query.contest.findFirst({
    where: eq(contest.id, contestId),
    with: { problems: true },
  });

  if (!found) throw new Error("Contest not found.");
  if (found.createdBy !== currentUser.id) throw new Error("Forbidden");
  if (found.status !== "draft")
    throw new Error("Contest is already published.");

  const fields: PublishContestFieldError[] = [];
  if (!found.name.trim()) fields.push("name");
  if (!found.startDate) fields.push("startDate");
  else if (found.startDate <= new Date()) fields.push("startDatePast");
  if (!found.endDate || (found.startDate && found.endDate <= found.startDate))
    fields.push("endDate");
  if (found.problems.length === 0) fields.push("problems");

  if (fields.length > 0) return fail(PUBLISH_MISSING_FIELDS, { fields });

  const [result] = await db
    .update(contest)
    .set({ status: "published" })
    .where(eq(contest.id, contestId))
    .returning();

  return ok(result);
}
