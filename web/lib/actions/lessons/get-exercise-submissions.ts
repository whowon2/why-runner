"use server";

import { db } from "@/drizzle/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { resolvePendingConstraintClassifications } from "@/lib/constraints/classify";
import { redactReport } from "@/lib/judge-report";

// Scoped by exerciseId, not problemId: the same problem can back more than
// one exercise (across lessons, contests, and standalone practice), so a
// submission to one exercise must never show up under another.
export async function getExerciseSubmissions(exerciseId: string) {
  const currentUser = await getCurrentUser({});

  const query = () =>
    db.query.submission.findMany({
      where: (s, { and, eq }) =>
        and(eq(s.exerciseId, exerciseId), eq(s.userId, currentUser.id)),
      orderBy: (s, { desc }) => desc(s.createdAt),
    });

  let rows = await query();

  const pendingIds = rows
    .filter((r) => r.status === "PENDING_CONSTRAINT_CLASSIFICATION")
    .map((r) => r.id);

  if (pendingIds.length > 0) {
    await resolvePendingConstraintClassifications(pendingIds);
    rows = await query();
  }

  if (rows.length === 0) return rows;

  // Expected outputs follow the lesson's showOutputs toggle (inputs are
  // already public on the exercise page); the lesson owner sees everything.
  const found = await db.query.exercise.findFirst({
    where: (e, { eq }) => eq(e.id, exerciseId),
    columns: {},
    with: {
      lesson: { columns: { createdBy: true, showOutputs: true } },
      problem: { columns: { createdBy: true, exampleCount: true } },
    },
  });
  if (!found) return [];

  const ctx = {
    fullAccess:
      found.lesson.createdBy === currentUser.id ||
      found.problem.createdBy === currentUser.id,
    exampleCount: found.problem.exampleCount,
    exercise: { showOutputs: found.lesson.showOutputs },
  };

  return rows.map((row) => ({
    ...row,
    output: redactReport(row.output, ctx),
  }));
}
