"use server";

import { db } from "@/drizzle/db";
import { desc } from "drizzle-orm";
import { activityFeed } from "@/drizzle/schema";

export async function getActivities() {
  const activities = await db.query.activityFeed.findMany({
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
