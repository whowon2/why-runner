"use server";

import { db } from "@/drizzle/db";
import { type CreateLessonInput, lesson } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function createLesson(input: CreateLessonInput) {
  await getCurrentUser({});

  const [created] = await db.insert(lesson).values(input).returning();
  return created;
}
