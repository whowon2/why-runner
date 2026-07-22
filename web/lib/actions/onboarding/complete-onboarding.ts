"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { user } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { usernameSchema } from "@/lib/username";

export async function completeOnboarding(username: string) {
  const currentUser = await getCurrentUser({});

  const parsed = usernameSchema.safeParse(username);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid username");
  }

  const existing = await db.query.user.findFirst({
    where: (u, { eq: eqOp, and, ne }) =>
      and(eqOp(u.username, parsed.data), ne(u.id, currentUser.id)),
  });
  if (existing) {
    throw new Error("Username is already taken");
  }

  await db
    .update(user)
    .set({ username: parsed.data, finishedOnboarding: true })
    .where(eq(user.id, currentUser.id));
}
