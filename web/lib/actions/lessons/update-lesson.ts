"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { lesson } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

async function assertOwnsLesson(lessonId: string, userId: string) {
  const found = await db.query.lesson.findFirst({
    where: eq(lesson.id, lessonId),
  });
  if (!found) throw new Error("Lesson not found");
  if (found.createdBy !== userId) throw new Error("Not the lesson owner");
  return found;
}

export async function updateLesson(input: {
  lessonId: string;
  title?: string;
  description?: string;
  dueDate?: Date | null;
}) {
  const currentUser = await getCurrentUser({});
  await assertOwnsLesson(input.lessonId, currentUser.id);

  const [updated] = await db
    .update(lesson)
    .set({
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
    })
    .where(eq(lesson.id, input.lessonId))
    .returning();

  return updated;
}

export async function setLessonPublished(input: {
  lessonId: string;
  isPublished: boolean;
}) {
  const currentUser = await getCurrentUser({});
  await assertOwnsLesson(input.lessonId, currentUser.id);

  const [updated] = await db
    .update(lesson)
    .set({ isPublished: input.isPublished })
    .where(eq(lesson.id, input.lessonId))
    .returning();

  return updated;
}

export async function deleteLesson(lessonId: string) {
  const currentUser = await getCurrentUser({});
  await assertOwnsLesson(lessonId, currentUser.id);

  await db.delete(lesson).where(eq(lesson.id, lessonId));
}
