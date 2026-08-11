"use server";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  lesson,
  lessonCompletion,
  lessonTrackSubmission,
  submission,
} from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

/**
 * Student submits the whole assignment at once: for every exercise in the
 * track, snapshot their most recent submission (if any) to that exercise's
 * problem, then record the track-level submission timestamp.
 */
export async function submitTrack(trackId: string) {
  const currentUser = await getCurrentUser({});

  const lessons = await db.query.lesson.findMany({
    where: eq(lesson.trackId, trackId),
  });
  if (lessons.length === 0)
    throw new Error("This assignment has no exercises yet");

  await db.transaction(async (tx) => {
    for (const l of lessons) {
      const latest = await tx.query.submission.findFirst({
        where: and(
          eq(submission.problemId, l.problemId),
          eq(submission.userId, currentUser.id),
        ),
        orderBy: desc(submission.createdAt),
      });

      await tx
        .insert(lessonCompletion)
        .values({
          userId: currentUser.id,
          lessonId: l.id,
          submissionId: latest?.id ?? null,
          language: latest?.language ?? null,
        })
        .onConflictDoUpdate({
          target: [lessonCompletion.userId, lessonCompletion.lessonId],
          set: {
            submissionId: latest?.id ?? null,
            language: latest?.language ?? null,
            completedAt: new Date(),
          },
        });
    }

    await tx
      .insert(lessonTrackSubmission)
      .values({ userId: currentUser.id, trackId })
      .onConflictDoUpdate({
        target: [lessonTrackSubmission.userId, lessonTrackSubmission.trackId],
        set: { submittedAt: new Date() },
      });
  });

  return { submittedAt: new Date() };
}
