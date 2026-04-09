"use server";

import { desc, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { activityFeed } from "@/drizzle/schema";

export async function getActivities(userId?: string) {
  const activities = await db.query.activityFeed.findMany({
    where: userId ? eq(activityFeed.userId, userId) : undefined,
    orderBy: [desc(activityFeed.createdAt)],
    limit: 50,
    with: {
      user: true,
      contest: true,
      problem: true,
    },
  });

  return activities;
}
