"use server";

import { z } from "zod";
import { db } from "@/drizzle/db";
import { ok } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canManageContest } from "@/lib/auth/permissions";
import { publicUserColumns } from "@/lib/public-user";
import { PICK_MODES } from "@/lib/similarity/pick";
import { runSimilarity } from "@/lib/similarity/run";

const inputSchema = z.object({
  contestId: z.uuid(),
  problemId: z.uuid(),
  pick: z.enum(PICK_MODES),
});

/** Contest owner or admin only: pairwise code similarity of participants' answers to one problem. */
export async function getContestProblemSimilarity(
  rawInput: z.infer<typeof inputSchema>,
) {
  const currentUser = await getCurrentUser({});
  const input = inputSchema.parse(rawInput);

  const found = await db.query.contest.findFirst({
    where: (c, { eq }) => eq(c.id, input.contestId),
    columns: { id: true, createdBy: true },
  });
  if (!found || !(await canManageContest(found, currentUser.id))) {
    throw new Error("Forbidden");
  }

  const attached = await db.query.problemOnContest.findFirst({
    where: (p, { and, eq }) =>
      and(eq(p.contestId, found.id), eq(p.problemId, input.problemId)),
    columns: { problemId: true },
  });
  if (!attached) throw new Error("Problem not in contest");

  const rows = await db.query.submission.findMany({
    where: (s, { and, eq, ne }) =>
      and(
        eq(s.contestId, found.id),
        eq(s.problemId, input.problemId),
        ne(s.userId, found.createdBy),
        ne(s.status, "CANCELED"),
      ),
    columns: {
      id: true,
      userId: true,
      status: true,
      createdAt: true,
      output: true,
      code: true,
      language: true,
    },
    with: { user: { columns: publicUserColumns } },
  });

  return ok(runSimilarity(rows, input.pick));
}
