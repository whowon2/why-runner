"use server";

import { db } from "@/drizzle/db";
import type { UpdateProfileInput } from "@/hooks/user-update-profile";
import { user } from "../db/schema";

export async function updateProfile(input: UpdateProfileInput) {
  await db.update(user).set(input);
}
