"use server";

import { eq, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/db";
import { classroomMembership, user } from "@/drizzle/schema";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { assertClassOwner } from "@/lib/auth/permissions";

const schema = z.union([
  z.object({
    classroomId: z.uuid(),
    userId: z.string().min(1).max(255),
  }),
  z.object({
    classroomId: z.uuid(),
    usernameOrEmail: z.string().trim().min(1).max(320),
  }),
]);

/**
 * Owner-level (owner or admin): makes an existing user a co-teacher, picked
 * by id (autocomplete) or by exact username/email (both case-insensitive),
 * creating their membership or promoting a student.
 */
export async function addCoTeacher(
  input: z.input<typeof schema>,
): Promise<ActionResult<{ userId: string }, "USER_NOT_FOUND" | "IS_OWNER">> {
  const parsed = schema.parse(input);
  const { classroomId } = parsed;
  const currentUser = await getCurrentUser({});
  const { classroom } = await assertClassOwner(classroomId, currentUser.id);

  let where;
  if ("userId" in parsed) {
    where = eq(user.id, parsed.userId);
  } else {
    const value = parsed.usernameOrEmail.toLowerCase();
    where = or(
      // Usernames are unique case-insensitively (user_username_lower_idx).
      eq(sql`lower(${user.username})`, value.replace(/^@/, "")),
      eq(sql`lower(${user.email})`, value),
    );
  }
  const found = await db.query.user.findFirst({
    where,
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
