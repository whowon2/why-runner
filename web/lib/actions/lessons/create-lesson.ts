"use server";

import { eq, max } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { type CreateLessonInput, lesson, lessonTrack } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function createLesson(input: CreateLessonInput) {
  const currentUser = await getCurrentUser({});

  const track = await db.query.lessonTrack.findFirst({
    where: eq(lessonTrack.id, input.trackId),
  });
  if (!track) throw new Error("Track not found");
  if (track.createdBy !== currentUser.id)
    throw new Error("Not the track owner");

  let order = input.order;
  if (order === undefined) {
    const [{ value }] = await db
      .select({ value: max(lesson.order) })
      .from(lesson)
      .where(eq(lesson.trackId, input.trackId));
    order = value === null ? 0 : value + 1;
  }

  const [created] = await db
    .insert(lesson)
    .values({ ...input, order })
    .returning();
  return created;
}

export async function reorderLessonEntry(input: {
  lessonId: string;
  order: number;
}) {
  const currentUser = await getCurrentUser({});

  const found = await db.query.lesson.findFirst({
    where: eq(lesson.id, input.lessonId),
    with: { track: true },
  });
  if (!found) throw new Error("Lesson not found");
  if (found.track.createdBy !== currentUser.id) {
    throw new Error("Not the track owner");
  }

  const [updated] = await db
    .update(lesson)
    .set({ order: input.order })
    .where(eq(lesson.id, input.lessonId))
    .returning();
  return updated;
}

export async function deleteLessonEntry(lessonId: string) {
  const currentUser = await getCurrentUser({});

  const found = await db.query.lesson.findFirst({
    where: eq(lesson.id, lessonId),
    with: { track: true },
  });
  if (!found) throw new Error("Lesson not found");
  if (found.track.createdBy !== currentUser.id) {
    throw new Error("Not the track owner");
  }

  await db.delete(lesson).where(eq(lesson.id, lessonId));
}
