"use server";

import { db } from "@/drizzle/db";
import { lesson } from "@/drizzle/schema";
import { assertClassOwner } from "@/lib/actions/classes/assert-class-member";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { generateSlug } from "@/lib/slug";

export async function createLesson(input: { classroomId: string }) {
  const currentUser = await getCurrentUser({});
  await assertClassOwner(input.classroomId, currentUser.id);

  const [created] = await db
    .insert(lesson)
    .values({
      classroomId: input.classroomId,
      createdBy: currentUser.id,
      slug: generateSlug("untitled-assignment"),
    })
    .returning();

  return created;
}
