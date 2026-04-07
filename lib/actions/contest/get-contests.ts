"use server";

import { db } from "@/drizzle/db";
import { contest } from "@/drizzle/schema"; // Ensure this imports your contest table definition
import { and, count, ilike, desc, eq } from "drizzle-orm";

export interface GetContestsParams {
  page: number;
  pageSize: number;
  search?: string;
  my?: boolean;
  userId?: string;
}

export async function getContests({
  page = 1,
  pageSize = 10,
  search,
  my,
  userId,
}: GetContestsParams) {
  const offset = (page - 1) * pageSize;

  const conditions = [];

  // Filter by title if search is present
  if (search) {
    conditions.push(ilike(contest.name, `%${search}%`));
  }

  if (my && userId) {
    conditions.push(eq(contest.createdBy, userId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Run queries in parallel
  const [data, totalResult] = await Promise.all([
    db.query.contest.findMany({
      limit: pageSize,
      offset: offset,
      where: whereClause,
      with: {
        users: true, // Preserving your existing relation
      },
      orderBy: [desc(contest.createdAt)], // Generally want newest contests first
    }),
    db.select({ count: count() }).from(contest).where(whereClause),
  ]);

  return {
    data,
    total: totalResult[0]?.count || 0,
  };
}
