"use server";

import { db } from "@/drizzle/db";
import { problem } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { generateProblemCode } from "@/lib/problem-code";
import { generateSlug } from "@/lib/slug";

export async function createProblem() {
  const currentUser = await getCurrentUser({});
  const [createdProblem] = await db
    .insert(problem)
    .values({
      slug: generateSlug("untitled-problem"),
      code: await generateProblemCode(),
      createdBy: currentUser.id,
      status: "draft",
    })
    .returning();
  return createdProblem;
}
