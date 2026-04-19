"use server";

import { db } from "@/drizzle/db";
import { problem } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

type CreateProblemInput = Omit<typeof problem.$inferInsert, "createdBy">;

export async function createProblem(input: CreateProblemInput) {
  const currentUser = await getCurrentUser({});
  const [createdProblem] = await db
    .insert(problem)
    .values({ ...input, createdBy: currentUser.id })
    .returning();
  return createdProblem;
}
