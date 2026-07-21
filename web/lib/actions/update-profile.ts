"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { user } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import type { UpdateProfileInput } from "@/hooks/user-update-profile";

export async function updateProfile(input: UpdateProfileInput) {
  const currentUser = await getCurrentUser({});
  await db.update(user).set(input).where(eq(user.id, currentUser.id));
}
