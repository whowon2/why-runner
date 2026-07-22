"use server";

import { db } from "@/drizzle/db";
import { contest } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { generateSlug } from "@/lib/slug";

export async function createContest() {
  const currentUser = await getCurrentUser({});

  const [result] = await db
    .insert(contest)
    .values({
      slug: generateSlug("untitled-contest"),
      createdBy: currentUser.id,
      status: "draft",
    })
    .returning();

  return result;
}
