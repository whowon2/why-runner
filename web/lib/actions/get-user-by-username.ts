"use server";

import { db } from "@/drizzle/db";

export async function getUserByUsername(username: string) {
  return await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.username, username),
  });
}
