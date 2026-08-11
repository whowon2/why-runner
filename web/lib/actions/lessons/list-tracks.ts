"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { lessonTrack } from "@/drizzle/schema";
import { assertClassMember } from "@/lib/actions/classes/assert-class-member";
import { getCurrentUser } from "@/lib/auth/get-current-user";

/** Assignments (tracks) in a class, for a member or the class owner. */
export async function listClassTracks(classroomId: string) {
  const currentUser = await getCurrentUser({});
  const classroom = await assertClassMember(classroomId, currentUser.id);
  const isOwner = classroom.createdBy === currentUser.id;

  const tracks = await db.query.lessonTrack.findMany({
    where: eq(lessonTrack.classroomId, classroomId),
    orderBy: (track, { asc }) => [asc(track.createdAt)],
  });

  // Non-owners only see published (assigned) tracks.
  return isOwner ? tracks : tracks.filter((t) => t.isPublished);
}
