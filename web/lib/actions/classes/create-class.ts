"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { classroom } from "@/drizzle/schema";
import { generateClassCode } from "@/lib/class-code";
import { getCurrentUser } from "@/lib/auth/get-current-user";

async function uniqueJoinCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateClassCode();
    const existing = await db.query.classroom.findFirst({
      where: eq(classroom.joinCode, code),
    });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique class code");
}

export async function createClass() {
  const currentUser = await getCurrentUser({});

  const [created] = await db
    .insert(classroom)
    .values({ createdBy: currentUser.id, joinCode: await uniqueJoinCode() })
    .returning();

  return created;
}
