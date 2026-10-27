"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/db";
import {
  Language,
  PROBLEM_TAGS,
  ProblemCompareMode,
  ProblemDifficulty,
  problem,
  problemChecker,
} from "@/drizzle/schema";
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
  compareMode: z.enum(ProblemCompareMode.enumValues).optional(),
  floatEpsilon: z.number().gt(0).lte(1).optional(),
  // `null` removes the checker; omitted leaves it as is. Portugol can't be a
  // checker: its runner rewrites stdin and takes no arguments.
  checker: z
    .object({
      language: z.enum(Language.enumValues).exclude(["portugol"]),
      code: z.string().trim().min(1).max(100_000),
    })
    .nullable()
    .optional(),
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
    columns: { title: true, compareMode: true },
  });

  if (!existing) throw new Error("Problem not found.");

  const parsed = updateProblemSchema.safeParse(input.problem);
  if (!parsed.success) throw new Error("Invalid problem data.");

  const { checker, ...fields } = parsed.data;
  const values: Partial<typeof problem.$inferInsert> = { ...fields };
  if (values.title && values.title !== existing.title) {
    values.slug = generateSlug(values.title);
  }

  const compareMode = values.compareMode ?? existing.compareMode;
  if (compareMode === "checker") {
    const hasChecker =
      checker !== undefined
        ? checker !== null
        : !!(await db.query.problemChecker.findFirst({
            where: eq(problemChecker.problemId, input.problemId),
            columns: { problemId: true },
          }));
    if (!hasChecker) {
      throw new Error("Checker mode needs a checker program.");
    }
  }

  return db.transaction(async (tx) => {
    const [result] = await tx
      .update(problem)
      .set(values)
      .where(
        and(
          eq(problem.id, input.problemId),
          eq(problem.createdBy, currentUser.id),
        ),
      )
      .returning();

    if (checker === null) {
      await tx
        .delete(problemChecker)
        .where(eq(problemChecker.problemId, input.problemId));
    } else if (checker) {
      await tx
        .insert(problemChecker)
        .values({
          problemId: input.problemId,
          language: checker.language,
          code: checker.code,
        })
        .onConflictDoUpdate({
          target: problemChecker.problemId,
          set: { language: checker.language, code: checker.code },
        });
    }

    return result;
  });
}
