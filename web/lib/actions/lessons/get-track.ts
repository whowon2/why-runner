"use server";

import { db } from "@/drizzle/db";
import { assertClassMember } from "@/lib/actions/classes/assert-class-member";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function getTrack(trackId: string) {
  const currentUser = await getCurrentUser({});

  const track = await db.query.lessonTrack.findFirst({
    where: (t, { eq }) => eq(t.id, trackId),
  });
  if (!track) throw new Error("Track not found");

  const classroom = await assertClassMember(track.classroomId, currentUser.id);
  const isOwner = classroom.createdBy === currentUser.id;
  if (!track.isPublished && !isOwner) throw new Error("Track not found");

  const [lessons, passedSubmissions, trackSubmission] = await Promise.all([
    db.query.lesson.findMany({
      where: (lesson, { eq }) => eq(lesson.trackId, trackId),
      orderBy: (lesson, { asc }) => [asc(lesson.order)],
      with: {
        problem: { columns: { inputs: false, outputs: false } },
      },
    }),
    db.query.submission.findMany({
      where: (submission, { and, eq }) =>
        and(
          eq(submission.userId, currentUser.id),
          eq(submission.status, "PASSED"),
        ),
      columns: { problemId: true },
    }),
    db.query.lessonTrackSubmission.findFirst({
      where: (s, { and, eq }) =>
        and(eq(s.userId, currentUser.id), eq(s.trackId, trackId)),
    }),
  ]);

  const passedProblemIds = new Set(passedSubmissions.map((s) => s.problemId));

  return {
    track,
    classroom,
    isOwner,
    submittedAt: trackSubmission?.submittedAt ?? null,
    lessons: lessons.map((l) => ({
      ...l,
      done: passedProblemIds.has(l.problemId),
    })),
  };
}
