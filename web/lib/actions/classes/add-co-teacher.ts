"use server";

import { eq, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/db";
import { classroomMembership, user } from "@/drizzle/schema";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { assertClassOwner } from "@/lib/auth/permissions";

const schema = z.object({
  classroomId: z.uuid(),
  usernameOrEmail: z.string().trim().min(1).max(320),
});

/**
 * Owner-level (owner or admin): makes an existing user a co-teacher by exact
 * username or email, creating their membership or promoting a student.
 */
export async function addCoTeacher(
  input: z.input<typeof schema>,
): Promise<ActionResult<{ userId: string }, "USER_NOT_FOUND" | "IS_OWNER">> {
  const { classroomId, usernameOrEmail } = schema.parse(input);
  const currentUser = await getCurrentUser({});
  const { classroom } = await assertClassOwner(classroomId, currentUser.id);

  const handle = usernameOrEmail.replace(/^@/, "");
  const found = await db.query.user.findFirst({
    where: or(
      eq(user.username, handle),
      eq(sql`lower(${user.email})`, usernameOrEmail.toLowerCase()),
    ),
    columns: { id: true },
  });
  if (!found) return fail("USER_NOT_FOUND");
  if (found.id === classroom.createdBy) return fail("IS_OWNER");

  await db
    .insert(classroomMembership)
    .values({ userId: found.id, classroomId, role: "teacher" })
    .onConflictDoUpdate({
      target: [classroomMembership.userId, classroomMembership.classroomId],
      set: { role: "teacher" },
    });

  return ok({ userId: found.id });
}
