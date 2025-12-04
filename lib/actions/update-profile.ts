"use server";

import type { UpdateProfileInput } from "@/hooks/user-update-profile";
import { db } from "@/lib/db";
import { user } from "../db/schema";

export async function updateProfile(input: UpdateProfileInput) {
  await db.update(user).set(input);
}
