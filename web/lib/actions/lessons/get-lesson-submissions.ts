"use server";

import { db } from "@/drizzle/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { awardLessonCompletionIfFirstPass } from "./award-lesson-completion";

export async function getLessonSubmissions(problemId: string) {
  const currentUser = await getCurrentUser({});

  const submissions = await db.query.submission.findMany({
    where: (s, { and, eq }) =>
      and(eq(s.problemId, problemId), eq(s.userId, currentUser.id)),
    orderBy: (s, { desc }) => desc(s.createdAt),
  });

  const passed = submissions.filter((s) => s.status === "PASSED");
  await Promise.all(
    passed.map((s) =>
      awardLessonCompletionIfFirstPass({
        userId: currentUser.id,
        problemId,
        language: s.language,
      }),
    ),
  );

  return submissions;
}
