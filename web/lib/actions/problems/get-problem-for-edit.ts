"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { problem } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function getProblemForEdit(problemId: string) {
  const currentUser = await getCurrentUser({});

  const result = await db.query.problem.findFirst({
    where: and(
      eq(problem.id, problemId),
      eq(problem.createdBy, currentUser.id),
    ),
  });

  return result ?? null;
}
