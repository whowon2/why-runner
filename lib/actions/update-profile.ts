"use server";

import { db } from "@/drizzle/db";
import { user } from "@/drizzle/schema";
import type { UpdateProfileInput } from "@/hooks/user-update-profile";

export async function updateProfile(input: UpdateProfileInput) {
  await db.update(user).set(input);
}
