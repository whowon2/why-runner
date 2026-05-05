"use server";

import { db } from "@/drizzle/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { letters } from "@/lib/letters";

export async function exportContestData(contestId: string): Promise<string> {
  const currentUser = await getCurrentUser({});

  const found = await db.query.contest.findFirst({
    where: (c, { eq }) => eq(c.id, contestId),
    with: {
      problems: { with: { problem: true } },
      users: {
        where: (u, { eq }) => eq(u.joinStatus, "accepted"),
        with: { user: true },
      },
    },
  });

  if (!found || found.createdBy !== currentUser.id) {
    throw new Error("Unauthorized");
  }

  const submissions = await db.query.submission.findMany({
    where: (s, { eq }) => eq(s.contestId, contestId),
  });

  const problemLetters = found.problems.map((_, i) => letters[i]);

  const header = [
    "Name",
    "Email",
    "Score",
    ...problemLetters,
    "Total Submissions",
    "Pass Rate",
  ];

  const rows = found.users
    .map(({ user: u, answered }) => {
      const userSubs = submissions.filter((s) => s.userId === u.id);
      const passed = userSubs.filter((s) => s.status === "PASSED").length;
      const total = userSubs.length;
      const passRate =
        total > 0 ? `${Math.round((passed / total) * 100)}%` : "0%";
      const problemCols = problemLetters.map((l) =>
        answered.includes(l) ? "✓" : "✗",
      );
      return [
        u.name,
        u.email,
        answered.length,
        ...problemCols,
        total,
        passRate,
      ] as (string | number)[];
    })
    .sort((a, b) => (b[2] as number) - (a[2] as number));

  const lines = [
    header.map((h) => `"${h}"`).join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ];

  return lines.join("\n");
}
