"use server";

import { db } from "@/drizzle/db";
import { lesson } from "@/drizzle/schema";
import { assertClassOwner } from "@/lib/actions/classes/assert-class-member";
import { normalizeLessonTitle } from "@/lib/actions/lessons/lesson-title";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { generateSlug } from "@/lib/slug";

export async function createLesson(input: {
  classroomId: string;
  title: string;
  description?: string;
}) {
  const currentUser = await getCurrentUser({});
  await assertClassOwner(input.classroomId, currentUser.id);

  const title = normalizeLessonTitle(input.title);

  const [created] = await db
    .insert(lesson)
    .values({
      classroomId: input.classroomId,
      createdBy: currentUser.id,
      title,
      description: input.description?.trim() ?? "",
      // Fixed at creation — renaming later keeps shared links working.
      slug: generateSlug(title),
    })
    .returning();

  return created;
}
