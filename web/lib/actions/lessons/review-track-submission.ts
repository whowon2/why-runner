"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { lessonTrack, lessonTrackSubmission } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

/** Professor-only: grade one student's whole-assignment submission. Only
 * possible after the track's due date (same gate as `getTrackReview`). */
export async function reviewTrackSubmission(input: {
  trackId: string;
  userId: string;
  score: number;
}) {
  const currentUser = await getCurrentUser({});

  const track = await db.query.lessonTrack.findFirst({
    where: eq(lessonTrack.id, input.trackId),
  });
  if (!track) throw new Error("Track not found");
  if (track.createdBy !== currentUser.id)
    throw new Error("Not the track owner");
  if (track.dueDate && track.dueDate > new Date()) {
    throw new Error("Can't review before the due date.");
  }

  const existing = await db.query.lessonTrackSubmission.findFirst({
    where: and(
      eq(lessonTrackSubmission.userId, input.userId),
      eq(lessonTrackSubmission.trackId, input.trackId),
    ),
  });
  if (!existing) throw new Error("Student hasn't submitted this assignment.");

  const [updated] = await db
    .update(lessonTrackSubmission)
    .set({ score: input.score, reviewedAt: new Date() })
    .where(
      and(
        eq(lessonTrackSubmission.userId, input.userId),
        eq(lessonTrackSubmission.trackId, input.trackId),
      ),
    )
    .returning();

  return updated;
}
