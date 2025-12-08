"use server";

import { db } from "@/drizzle/db";

export async function getProfile(userId: string) {
  return await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, userId),
  });
}
