"use server";

import { db } from "@/drizzle/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { resolvePendingConstraintClassifications } from "./resolve-pending-constraint-classifications";

export async function getExerciseSubmissions(problemId: string) {
  const currentUser = await getCurrentUser({});

  const query = () =>
    db.query.submission.findMany({
      where: (s, { and, eq }) =>
        and(eq(s.problemId, problemId), eq(s.userId, currentUser.id)),
      orderBy: (s, { desc }) => desc(s.createdAt),
    });

  const rows = await query();

  const pendingIds = rows
    .filter((r) => r.status === "PENDING_CONSTRAINT_CLASSIFICATION")
    .map((r) => r.id);

  if (pendingIds.length === 0) return rows;

  await resolvePendingConstraintClassifications(pendingIds);

  return query();
}
