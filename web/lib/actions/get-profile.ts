"use server";

import { count, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/drizzle/db";
import { contest, problem, user as userTable } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { publicUserColumns } from "@/lib/public-user";

export async function getProfile(userId: string) {
  const [user, contestCountResult, problemCountResult] = await Promise.all([
    db.query.user.findFirst({
      where: (u, { eq: eqOp }) => eqOp(u.id, userId),
      columns: publicUserColumns,
    }),
    db.select({ count: count() }).from(contest).where(eq(contest.createdBy, userId)),
    db.select({ count: count() }).from(problem).where(eq(problem.createdBy, userId)),
  ]);

  if (!user) return user;

  // RA is private: only the profile's owner gets it (for the edit form).
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  const own =
    session?.user.id === userId
      ? await db.query.user.findFirst({
          where: eq(userTable.id, userId),
          columns: { ra: true },
        })
      : undefined;

  return {
    ...user,
    ra: own?.ra ?? null,
    contestCount: contestCountResult[0]?.count ?? 0,
    problemCount: problemCountResult[0]?.count ?? 0,
  };
}
