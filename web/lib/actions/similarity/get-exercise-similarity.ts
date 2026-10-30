"use server";

import { z } from "zod";
import { db } from "@/drizzle/db";
import { fail, ok } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { assertCanManageClass, classStaffIds } from "@/lib/auth/permissions";
import { publicUserColumns } from "@/lib/public-user";
import { PICK_MODES } from "@/lib/similarity/pick";
import { runSimilarity } from "@/lib/similarity/run";

const inputSchema = z.object({
  exerciseId: z.uuid(),
  pick: z.enum(PICK_MODES),
});

/** Class managers only: pairwise code similarity of students' answers to one exercise. */
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
        columns: { title: true, slug: true, classroomId: true },
        with: { classroom: { columns: { slug: true } } },
      },
      problem: { columns: { title: true } },
    },
  });
  if (!found) throw new Error("Forbidden");
  const { classroom } = await assertCanManageClass(
    found.lesson.classroomId,
    currentUser.id,
  );
  // Every Parsons answer is a reordering of the professor's own lines, so
  // similarity says nothing about copying.
  if (found.mode === "parsons") return fail("PARSONS_NOT_SUPPORTED");

  // The owner's and co-teachers' own test runs are not student work.
  const staffIds = await classStaffIds(classroom);
  const rows = await db.query.submission.findMany({
    where: (s, { and, eq, notInArray }) =>
      and(eq(s.exerciseId, found.id), notInArray(s.userId, staffIds)),
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

  const { classroomId: _, ...lesson } = found.lesson;
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
