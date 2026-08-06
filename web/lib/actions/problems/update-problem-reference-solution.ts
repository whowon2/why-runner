"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  type Language,
  problem,
  problemReferenceSolution,
} from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function updateProblemReferenceSolution(input: {
  problemId: string;
  code: string;
  language: Language | null;
}) {
  const currentUser = await getCurrentUser({});

  const owned = await db.query.problem.findFirst({
    where: and(
      eq(problem.id, input.problemId),
      eq(problem.createdBy, currentUser.id),
    ),
    columns: { id: true },
  });

  if (!owned) throw new Error("Problem not found.");

  const [result] = await db
    .insert(problemReferenceSolution)
    .values({
      problemId: input.problemId,
      code: input.code,
      language: input.language,
    })
    .onConflictDoUpdate({
      target: problemReferenceSolution.problemId,
      set: { code: input.code, language: input.language },
    })
    .returning();

  return result;
}
