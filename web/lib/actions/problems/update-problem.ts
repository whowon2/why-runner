"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/db";
import { PROBLEM_TAGS, problem } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { generateSlug } from "@/lib/slug";
import type { UpdateProblemInput } from "@/hooks/use-update-problem";

export async function updateProblem(input: UpdateProblemInput) {
  const currentUser = await getCurrentUser({});

  const existing = await db.query.problem.findFirst({
    where: and(
      eq(problem.id, input.problemId),
      eq(problem.createdBy, currentUser.id),
    ),
    columns: { title: true },
  });

  if (!existing) throw new Error("Problem not found.");

  const values = { ...input.problem };
  if (values.tags !== undefined) {
    const parsed = z.array(z.enum(PROBLEM_TAGS)).safeParse(values.tags);
    if (!parsed.success) throw new Error("Invalid problem tags.");
    values.tags = [...new Set(parsed.data)];
  }
  if (values.title && values.title !== existing.title) {
    values.slug = generateSlug(values.title);
  }

  const [result] = await db
    .update(problem)
    .set(values)
    .where(
      and(
        eq(problem.id, input.problemId),
        eq(problem.createdBy, currentUser.id),
      ),
    )
    .returning();

  return result;
}
