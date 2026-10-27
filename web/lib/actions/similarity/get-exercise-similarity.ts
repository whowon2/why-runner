"use server";

import { z } from "zod";
import { db } from "@/drizzle/db";
import { fail, ok } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { publicUserColumns } from "@/lib/public-user";
import { PICK_MODES } from "@/lib/similarity/pick";
import { runSimilarity } from "@/lib/similarity/run";

const inputSchema = z.object({
  exerciseId: z.uuid(),
  pick: z.enum(PICK_MODES),
});

/** Lesson owner only: pairwise code similarity of students' answers to one exercise. */
export async function getExerciseSimilarity(
  rawInput: z.infer<typeof inputSchema>,
) {
  const currentUser = await getCurrentUser({});
  const input = inputSchema.parse(rawInput);

  const found = await db.query.exercise.findFirst({
    where: (e, { eq }) => eq(e.id, input.exerciseId),
    columns: { id: true, slug: true, mode: true },
    with: {
      lesson: {
        columns: { title: true, slug: true, createdBy: true },
        with: { classroom: { columns: { slug: true } } },
      },
      problem: { columns: { title: true } },
    },
  });
  if (!found || found.lesson.createdBy !== currentUser.id) {
    throw new Error("Forbidden");
  }
  // Every Parsons answer is a reordering of the professor's own lines, so
  // similarity says nothing about copying.
  if (found.mode === "parsons") return fail("PARSONS_NOT_SUPPORTED");

  const rows = await db.query.submission.findMany({
    where: (s, { and, eq, ne }) =>
      and(eq(s.exerciseId, found.id), ne(s.userId, found.lesson.createdBy)),
    columns: {
      id: true,
      userId: true,
      status: true,
      createdAt: true,
      output: true,
      code: true,
      language: true,
    },
    with: { user: { columns: publicUserColumns } },
  });

  const { createdBy: _, ...lesson } = found.lesson;
  return ok({
    exercise: {
      slug: found.slug,
      mode: found.mode,
      problemTitle: found.problem.title,
      lesson,
    },
    ...runSimilarity(rows, input.pick),
  });
}
