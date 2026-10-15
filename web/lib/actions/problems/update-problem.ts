"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/db";
import { PROBLEM_TAGS, ProblemDifficulty, problem } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { generateSlug } from "@/lib/slug";

// The only fields an author may write through this action. Status changes
// go through publishProblem; id/code/slug/createdBy are server-owned.
const updateProblemSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  narrative: z.string().nullable().optional(),
  difficulty: z.enum(ProblemDifficulty.enumValues).nullable().optional(),
  tags: z
    .array(z.enum(PROBLEM_TAGS))
    .transform((tags) => [...new Set(tags)])
    .optional(),
  inputs: z.array(z.string()).optional(),
  outputs: z.array(z.string()).optional(),
  exampleCount: z.number().int().min(0).optional(),
});

export type UpdateProblemInput = {
  problemId: string;
  problem: z.input<typeof updateProblemSchema>;
};

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

  const parsed = updateProblemSchema.safeParse(input.problem);
  if (!parsed.success) throw new Error("Invalid problem data.");

  const values: Partial<typeof problem.$inferInsert> = { ...parsed.data };
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
