"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/db";
import { UserRole, user } from "@/drizzle/schema";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { assertAdmin } from "@/lib/auth/permissions";

const schema = z.object({
  userId: z.string().min(1),
  role: z.enum(UserRole.enumValues),
});

/** Admin only: promote a user to admin or demote an admin. Never yourself. */
export async function setUserRole(
  input: z.input<typeof schema>,
): Promise<ActionResult<void, "CANNOT_DEMOTE_SELF">> {
  const currentUser = await getCurrentUser({});
  await assertAdmin(currentUser.id);
  const { userId, role } = schema.parse(input);

  if (userId === currentUser.id && role !== "admin") {
    return fail("CANNOT_DEMOTE_SELF");
  }

  const [updated] = await db
    .update(user)
    .set({ role })
    .where(eq(user.id, userId))
    .returning({ id: user.id });
  if (!updated) throw new Error("User not found");

  return ok(undefined);
}
