"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { classroom } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { assertCanManageClass } from "@/lib/auth/permissions";

export async function updateClass(input: {
  classroomId: string;
  name: string;
}) {
  const currentUser = await getCurrentUser({});
  await assertCanManageClass(input.classroomId, currentUser.id);

  const [updated] = await db
    .update(classroom)
    .set({ name: input.name })
    .where(eq(classroom.id, input.classroomId))
    .returning();

  return updated;
}
