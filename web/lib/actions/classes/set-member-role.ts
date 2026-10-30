"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/db";
import { ClassroomRole, classroomMembership } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { assertClassOwner } from "@/lib/auth/permissions";

const schema = z.object({
  classroomId: z.uuid(),
  userId: z.string().min(1),
  role: z.enum(ClassroomRole.enumValues),
});

/** Owner-level (owner or admin): promote a member to co-teacher or demote back to student. */
export async function setMemberRole(input: z.input<typeof schema>) {
  const { classroomId, userId, role } = schema.parse(input);
  const currentUser = await getCurrentUser({});
  const { classroom } = await assertClassOwner(classroomId, currentUser.id);

  if (userId === classroom.createdBy) {
    throw new Error("The class owner's role cannot be changed.");
  }

  const [updated] = await db
    .update(classroomMembership)
    .set({ role })
    .where(
      and(
        eq(classroomMembership.classroomId, classroomId),
        eq(classroomMembership.userId, userId),
      ),
    )
    .returning({ userId: classroomMembership.userId });
  if (!updated) throw new Error("Not a member of this class");
}
