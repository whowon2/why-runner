"use server";

import { db } from "@/drizzle/db";
import { lessonTrack } from "@/drizzle/schema";
import { assertClassOwner } from "@/lib/actions/classes/assert-class-member";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { generateSlug } from "@/lib/slug";

export async function createTrack(input: { classroomId: string }) {
  const currentUser = await getCurrentUser({});
  await assertClassOwner(input.classroomId, currentUser.id);

  const [created] = await db
    .insert(lessonTrack)
    .values({
      classroomId: input.classroomId,
      createdBy: currentUser.id,
      slug: generateSlug("untitled-assignment"),
    })
    .returning();

  return created;
}
