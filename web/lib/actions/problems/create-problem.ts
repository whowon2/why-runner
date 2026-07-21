"use server";

import { db } from "@/drizzle/db";
import { type CreateProblemInput, problem } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { generateSlug } from "@/lib/slug";

export async function createProblem(input: CreateProblemInput) {
  const currentUser = await getCurrentUser({});
  const [createdProblem] = await db
    .insert(problem)
    .values({
      ...input,
      slug: generateSlug(input.title),
      createdBy: currentUser.id,
    })
    .returning();
  return createdProblem;
}
