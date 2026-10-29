"use server";

import { sql } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { publicUserColumns } from "@/lib/public-user";

export async function getUserByUsername(username: string) {
  return await db.query.user.findFirst({
    // Case-insensitive, served by `user_username_lower_idx`.
    where: (u) => sql`lower(${u.username}) = lower(${username})`,
    columns: publicUserColumns,
  });
}
