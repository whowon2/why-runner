"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { userPreference } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

/** The caller's settings row, or null when they never saved one. */
export async function getUserPreferences() {
  const currentUser = await getCurrentUser({});

  const row = await db.query.userPreference.findFirst({
    where: eq(userPreference.userId, currentUser.id),
  });

  return row ?? null;
}
