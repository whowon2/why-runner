"use server";

import { and, asc, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  problemOnContest,
  submission,
  user,
  userOnContest,
} from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canManageContest } from "@/lib/auth/permissions";
import { computeStandings, type Standings } from "@/lib/contest/standings";

export async function getContestLeaderboard(
  contestId: string,
): Promise<Standings | null> {
  const currentUser = await getCurrentUser({});

  const found = await db.query.contest.findFirst({
    where: (c, { eq }) => eq(c.id, contestId),
    columns: {
      status: true,
      isPrivate: true,
      createdBy: true,
      startDate: true,
      endDate: true,
    },
  });
  if (!found) return null;

  // Same visibility rules as `getContest`.
  const isOwner = await canManageContest(found, currentUser.id);
  if (found.status === "draft" && !isOwner) return null;
  if (found.isPrivate && !isOwner) {
    const membership = await db.query.userOnContest.findFirst({
      where: and(
        eq(userOnContest.contestId, contestId),
        eq(userOnContest.userId, currentUser.id),
      ),
      columns: { joinStatus: true },
    });
    if (membership?.joinStatus !== "accepted") return null;
  }

  const [problems, participants, submissions] = await Promise.all([
    db
      .select({ problemId: problemOnContest.problemId })
      .from(problemOnContest)
      .where(eq(problemOnContest.contestId, contestId))
      .orderBy(asc(problemOnContest.order)),
    // Only public profile fields — never email.
    db
      .select({
        id: user.id,
        name: user.name,
        username: user.username,
        image: user.image,
      })
      .from(userOnContest)
      .innerJoin(user, eq(user.id, userOnContest.userId))
      .where(
        and(
          eq(userOnContest.contestId, contestId),
          eq(userOnContest.joinStatus, "accepted"),
        ),
      ),
    db
      .select({
        id: submission.id,
        userId: submission.userId,
        problemId: submission.problemId,
        status: submission.status,
        createdAt: submission.createdAt,
      })
      .from(submission)
      .where(eq(submission.contestId, contestId)),
  ]);

  return computeStandings({
    contest: { startDate: found.startDate, endDate: found.endDate },
    problemIds: problems.map((p) => p.problemId),
    participants,
    submissions,
  });
}
