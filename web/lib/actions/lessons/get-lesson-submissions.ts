"use server";

import { db } from "@/drizzle/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function getLessonSubmissions(problemId: string) {
  const currentUser = await getCurrentUser({});

  return db.query.submission.findMany({
    where: (s, { and, eq }) =>
      and(eq(s.problemId, problemId), eq(s.userId, currentUser.id)),
    orderBy: (s, { desc }) => desc(s.createdAt),
  });
}
