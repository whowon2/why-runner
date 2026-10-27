"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { problem } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getProblemChecker } from "@/lib/problem-checker";

export async function getProblemForEdit(problemId: string) {
  const currentUser = await getCurrentUser({});

  const result = await db.query.problem.findFirst({
    where: and(
      eq(problem.id, problemId),
      eq(problem.createdBy, currentUser.id),
    ),
  });

  if (!result) return null;

  // Owner-only view: the only place the checker source reaches a client.
  return { ...result, checker: await getProblemChecker(problemId) };
}
