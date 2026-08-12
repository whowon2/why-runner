"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { problem } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function deleteProblem(problemId: string) {
  const currentUser = await getCurrentUser({});

  const found = await db.query.problem.findFirst({
    where: eq(problem.id, problemId),
  });

  if (!found) throw new Error("Problem not found.");
  if (found.createdBy !== currentUser.id) throw new Error("Forbidden");

  // Published problems may already have submissions, contest assignments and
  // lesson exercises riding on them. Drafts are safe to delete outright.
  if (found.status !== "draft")
    throw new Error("Only draft problems can be deleted.");

  await db.delete(problem).where(eq(problem.id, problemId));
}
