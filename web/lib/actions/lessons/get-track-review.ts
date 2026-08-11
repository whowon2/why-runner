"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { classroomMembership, lessonTrack } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

/** Professor-only: every class member's whole-assignment submission, exercise by exercise. */
export async function getTrackReview(trackId: string) {
  const currentUser = await getCurrentUser({});

  const track = await db.query.lessonTrack.findFirst({
    where: eq(lessonTrack.id, trackId),
  });
  if (!track) throw new Error("Track not found");
  if (track.createdBy !== currentUser.id)
    throw new Error("Not the track owner");
  // Professor can only review after the due date — while it's still open,
  // students may keep resubmitting, so any earlier "review" would just be a
  // snapshot of in-progress work. No due date set means review is always
  // open (matches the field's optional, non-blocking default elsewhere).
  if (track.dueDate && track.dueDate > new Date()) {
    throw new Error("REVIEW_NOT_YET_AVAILABLE");
  }

  const [lessons, members, trackSubmissions] = await Promise.all([
    db.query.lesson.findMany({
      where: (lesson, { eq }) => eq(lesson.trackId, trackId),
      orderBy: (lesson, { asc }) => [asc(lesson.order)],
      with: {
        problem: { columns: { id: true, title: true } },
        completions: {
          with: { user: true, submission: true },
        },
      },
    }),
    db.query.classroomMembership.findMany({
      where: eq(classroomMembership.classroomId, track.classroomId),
      with: { user: true },
    }),
    db.query.lessonTrackSubmission.findMany({
      where: (s, { eq }) => eq(s.trackId, trackId),
    }),
  ]);

  const students = members
    .filter((m) => m.userId !== track.createdBy)
    .map((m) => m.user);

  const submissionByUser = new Map(trackSubmissions.map((s) => [s.userId, s]));

  return {
    track,
    students: students.map((student) => ({
      student,
      submittedAt: submissionByUser.get(student.id)?.submittedAt ?? null,
      reviewedAt: submissionByUser.get(student.id)?.reviewedAt ?? null,
      score: submissionByUser.get(student.id)?.score ?? null,
      answers: lessons.map((l) => {
        const completion = l.completions.find((c) => c.userId === student.id);
        return {
          lessonId: l.id,
          problem: l.problem,
          submission: completion?.submission ?? null,
        };
      }),
    })),
  };
}
