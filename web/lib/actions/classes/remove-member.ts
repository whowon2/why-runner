"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { classroomMembership } from "@/drizzle/schema";
import { assertClassOwner } from "@/lib/actions/classes/assert-class-member";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function removeMember(classroomId: string, userId: string) {
  const currentUser = await getCurrentUser({});
  await assertClassOwner(classroomId, currentUser.id);

  if (userId === currentUser.id) {
    throw new Error("Owner cannot remove themself as a member.");
  }

  await db
    .delete(classroomMembership)
    .where(
      and(
        eq(classroomMembership.classroomId, classroomId),
        eq(classroomMembership.userId, userId),
      ),
    );
}
