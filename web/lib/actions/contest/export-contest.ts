"use server";

import { and, asc, eq } from "drizzle-orm";
import JSZip from "jszip";
import { db } from "@/drizzle/db";
import {
  problem,
  problemOnContest,
  submission,
  user,
  userOnContest,
} from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redactReport } from "@/lib/judge-report";
import {
  codeFilePath,
  standingsCellText,
  toCsv,
  truncate,
} from "@/lib/contest/export-bundle";
import {
  computeStandings,
  countedSubmissionIds,
} from "@/lib/contest/standings";

/**
 * Owner-only export as a base64 ZIP: `standings.csv` (same computation and
 * order as the leaderboard), `submissions.csv` (one row per submission), and
 * every submission's source under `code/`.
 */
export async function exportContestData(contestId: string): Promise<string> {
  const currentUser = await getCurrentUser({});

  const found = await db.query.contest.findFirst({
    where: (c, { eq }) => eq(c.id, contestId),
    columns: { createdBy: true, startDate: true, endDate: true },
  });

  if (!found || found.createdBy !== currentUser.id) {
    throw new Error("Unauthorized");
  }

  const [problems, participants, submissions] = await Promise.all([
    db
      .select({ problemId: problemOnContest.problemId, title: problem.title })
      .from(problemOnContest)
      .innerJoin(problem, eq(problem.id, problemOnContest.problemId))
      .where(eq(problemOnContest.contestId, contestId))
      .orderBy(asc(problemOnContest.order)),
    db
      .select({
        id: user.id,
        name: user.name,
        username: user.username,
        image: user.image,
        email: user.email,
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
        language: submission.language,
        code: submission.code,
        output: submission.output,
        constraintViolationDetail: submission.constraintViolationDetail,
        runtimeMs: submission.runtimeMs,
        memoryKb: submission.memoryKb,
        codeSize: submission.codeSize,
        userName: user.name,
        username: user.username,
        email: user.email,
        problemCreatedBy: problem.createdBy,
        visible: problem.visible,
      })
      .from(submission)
      .innerJoin(user, eq(user.id, submission.userId))
      .innerJoin(problem, eq(problem.id, submission.problemId))
      .where(eq(submission.contestId, contestId))
      .orderBy(asc(submission.createdAt)),
  ]);

  const contestWindow = {
    startDate: found.startDate,
    endDate: found.endDate,
  };
  const standings = computeStandings({
    contest: contestWindow,
    problemIds: problems.map((p) => p.problemId),
    participants,
    submissions,
  });
  const counted = countedSubmissionIds(contestWindow, submissions);
  const letterOf = new Map(
    standings.problems.map((p) => [p.problemId, p.letter]),
  );
  const titleOf = new Map(problems.map((p) => [p.problemId, p.title]));
  const emailOf = new Map(participants.map((p) => [p.id, p.email]));

  const zip = new JSZip();

  // standings.csv
  const subStats = new Map<string, { total: number; passed: number }>();
  for (const s of submissions) {
    const st = subStats.get(s.userId) ?? { total: 0, passed: 0 };
    st.total += 1;
    if (s.status === "PASSED") st.passed += 1;
    subStats.set(s.userId, st);
  }
  zip.file(
    "standings.csv",
    toCsv([
      [
        "Rank",
        "Name",
        "Username",
        "Email",
        "Solved",
        "Penalty",
        ...standings.problems.map((p) => p.letter),
        "Total Submissions",
        "Pass Rate",
      ],
      ...standings.rows.map((r) => {
        const st = subStats.get(r.user.id) ?? { total: 0, passed: 0 };
        return [
          r.rank,
          r.user.name,
          r.user.username,
          emailOf.get(r.user.id) ?? "",
          r.solved,
          r.penalty,
          ...standings.problems.map((p) =>
            standingsCellText(r.cells[p.problemId]),
          ),
          st.total,
          st.total > 0 ? `${Math.round((st.passed / st.total) * 100)}%` : "0%",
        ];
      }),
    ]),
  );

  // submissions.csv + code files
  const sequence = new Map<string, number>();
  const submissionRows = submissions.map((s) => {
    const seqKey = `${s.userId}:${s.problemId}`;
    const seq = (sequence.get(seqKey) ?? 0) + 1;
    sequence.set(seqKey, seq);
    // A problem removed from the contest keeps its submissions: "?" in the
    // CSV, "_" in the file path.
    const letter = letterOf.get(s.problemId) ?? "_";
    const path = codeFilePath({
      username: s.username,
      letter,
      sequence: seq,
      status: s.status,
      language: s.language,
    });
    zip.file(path, s.code);
    const minute = found.startDate
      ? Math.floor((s.createdAt.getTime() - found.startDate.getTime()) / 60_000)
      : "";
    return [
      s.createdAt.toISOString(),
      minute,
      s.userName,
      s.username,
      s.email,
      letterOf.get(s.problemId) ?? "?",
      titleOf.get(s.problemId) ?? "",
      s.language ?? "",
      s.status,
      counted.has(s.id) ? "yes" : "no",
      s.runtimeMs ?? "",
      s.memoryKb ?? "",
      s.codeSize ?? "",
      s.constraintViolationDetail ?? "",
      // Same visibility as the submissions table: hidden-test details only
      // for problems the contest owner wrote.
      truncate(
        redactReport(s.output, {
          fullAccess: s.problemCreatedBy === currentUser.id,
          visible: s.visible,
        }),
      ),
      path,
    ];
  });
  zip.file(
    "submissions.csv",
    toCsv([
      [
        "Submitted At",
        "Minute",
        "Name",
        "Username",
        "Email",
        "Problem",
        "Problem Title",
        "Language",
        "Status",
        "Counted",
        "Runtime (ms)",
        "Memory (KB)",
        "Code Size",
        "Constraint Violation",
        "Judge Output",
        "Code File",
      ],
      ...submissionRows,
    ]),
  );

  return zip.generateAsync({ type: "base64", compression: "DEFLATE" });
}
