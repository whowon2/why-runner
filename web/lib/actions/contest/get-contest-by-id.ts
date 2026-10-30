"use server";

import { and, asc, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { problemOnContest, userOnContest } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canManageContest } from "@/lib/auth/permissions";

const problemColumns = { inputs: false, outputs: false } as const;

export async function getContest(id: string) {
  const currentUser = await getCurrentUser({});

  const found = await db.query.contest.findFirst({
    where: (contests, { eq }) => eq(contests.id, id),
    with: {
      problems: {
        with: {
          problem: {
            columns: problemColumns,
            with: { user: { columns: { name: true, username: true } } },
          },
        },
        orderBy: asc(problemOnContest.order),
      },
      users: true,
    },
  });

  if (!found) return null;
  // Creator or admin: sees drafts and every owner control.
  const canManage = await canManageContest(found, currentUser.id);
  if (found.status === "draft" && !canManage) return null;

  const membership = await db.query.userOnContest.findFirst({
    where: and(
      eq(userOnContest.contestId, id),
      eq(userOnContest.userId, currentUser.id),
    ),
    columns: { joinStatus: true },
  });

  const joinStatus = membership?.joinStatus ?? null;
  const canViewProblems =
    canManage || !found.isPrivate || joinStatus === "accepted";

  return {
    ...found,
    joinStatus,
    canManage,
    problems: canViewProblems ? found.problems : [],
  };
}

export async function getContestBySlug(slug: string) {
  const currentUser = await getCurrentUser({});

  const found = await db.query.contest.findFirst({
    where: (contests, { eq }) => eq(contests.slug, slug),
  });

  if (!found) return null;
  // Creator or admin: sees drafts and every owner control.
  const canManage = await canManageContest(found, currentUser.id);
  if (found.status === "draft" && !canManage) return null;

  return { ...found, canManage };
}
