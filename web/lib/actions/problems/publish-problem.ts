"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { activityFeed, problem } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getMissingProblemFields,
  PUBLISH_MISSING_FIELDS_PREFIX,
} from "./publish-problem-shared";

export async function publishProblem(problemId: string) {
  const currentUser = await getCurrentUser({});

  const found = await db.query.problem.findFirst({
    where: eq(problem.id, problemId),
  });

  if (!found) throw new Error("Problem not found.");
  if (found.createdBy !== currentUser.id) throw new Error("Forbidden");
  if (found.status !== "draft")
    throw new Error("Problem is already published.");

  const fields = getMissingProblemFields(found);

  if (fields.length > 0)
    throw new Error(`${PUBLISH_MISSING_FIELDS_PREFIX}${fields.join(",")}`);

  const [result] = await db
    .update(problem)
    .set({ status: "published" })
    .where(eq(problem.id, problemId))
    .returning();

  await db.insert(activityFeed).values({
    userId: currentUser.id,
    type: "PROBLEM_CREATED",
    problemId: result.id,
  });

  return result;
}
