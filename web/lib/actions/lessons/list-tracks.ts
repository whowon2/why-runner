"use server";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { lesson, lessonTrack, lessonTrackSubmission, submission } from "@/drizzle/schema";
import { assertClassMember } from "@/lib/actions/classes/assert-class-member";
import { getCurrentUser } from "@/lib/auth/get-current-user";

/** Assignments (tracks) in a class, for a member or the class owner. */
export async function listClassTracks(classroomId: string) {
  const currentUser = await getCurrentUser({});
  const classroom = await assertClassMember(classroomId, currentUser.id);
  const isOwner = classroom.createdBy === currentUser.id;

  const allTracks = await db.query.lessonTrack.findMany({
    where: eq(lessonTrack.classroomId, classroomId),
    orderBy: (track, { asc }) => [asc(track.createdAt)],
  });

  // Non-owners only see published (assigned) tracks.
  const tracks = isOwner ? allTracks : allTracks.filter((t) => t.isPublished);
  if (tracks.length === 0) return [];

  const trackIds = tracks.map((t) => t.id);

  const lessons = await db.query.lesson.findMany({
    where: inArray(lesson.trackId, trackIds),
    columns: { id: true, trackId: true, problemId: true },
  });
  const lessonsByTrack = new Map<string, typeof lessons>();
  for (const l of lessons) {
    lessonsByTrack.set(l.trackId, [...(lessonsByTrack.get(l.trackId) ?? []), l]);
  }

  // Professors don't submit exercises — this per-user progress/submission
  // data is only meaningful (and only fetched) for the current student.
  if (isOwner) {
    return tracks.map((track) => ({
      ...track,
      exerciseCount: lessonsByTrack.get(track.id)?.length ?? 0,
      completedCount: null,
      mySubmission: null,
    }));
  }

  const problemIds = lessons.map((l) => l.problemId);
  const [passedSubmissions, mySubmissions] = await Promise.all([
    problemIds.length
      ? db.query.submission.findMany({
          where: and(
            eq(submission.userId, currentUser.id),
            eq(submission.status, "PASSED"),
            inArray(submission.problemId, problemIds),
          ),
          columns: { problemId: true },
        })
      : [],
    db.query.lessonTrackSubmission.findMany({
      where: and(
        eq(lessonTrackSubmission.userId, currentUser.id),
        inArray(lessonTrackSubmission.trackId, trackIds),
      ),
    }),
  ]);

  const passedProblemIds = new Set(passedSubmissions.map((s) => s.problemId));
  const mySubmissionByTrack = new Map(mySubmissions.map((s) => [s.trackId, s]));

  return tracks.map((track) => {
    const trackLessons = lessonsByTrack.get(track.id) ?? [];
    const completedCount = trackLessons.filter((l) =>
      passedProblemIds.has(l.problemId),
    ).length;

    return {
      ...track,
      exerciseCount: trackLessons.length,
      completedCount,
      mySubmission: mySubmissionByTrack.get(track.id) ?? null,
    };
  });
}
