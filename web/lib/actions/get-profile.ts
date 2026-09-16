"use server";

import { count, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { contest, problem } from "@/drizzle/schema";

export async function getProfile(userId: string) {
  const [user, contestCountResult, problemCountResult] = await Promise.all([
    db.query.user.findFirst({
      where: (u, { eq: eqOp }) => eqOp(u.id, userId),
    }),
    db.select({ count: count() }).from(contest).where(eq(contest.createdBy, userId)),
    db.select({ count: count() }).from(problem).where(eq(problem.createdBy, userId)),
  ]);

  if (!user) return user;

  return {
    ...user,
    contestCount: contestCountResult[0]?.count ?? 0,
    problemCount: problemCountResult[0]?.count ?? 0,
  };
}
