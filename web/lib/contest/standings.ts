import type { Submission } from "@/drizzle/schema";
import { letters } from "@/lib/letters";

// Standings are derived from the `submission` table, not from
// `userOnContest.answered`: `answered` is only the resubmit gate and carries
// no timestamps/attempts (it can also include a PASSED made after the
// contest ended, which standings deliberately ignore).

export const PENALTY_PER_REJECTION_MIN = 20;

type StatusClass = "solved" | "rejected" | "pending" | "ignored";

export function classifyStatus(status: Submission["status"]): StatusClass {
  switch (status) {
    case "PASSED":
      return "solved";
    case "WRONG_ANSWER":
    case "TIME_LIMIT_EXCEEDED":
    case "MEMORY_LIMIT_EXCEEDED":
    case "RUNTIME_ERROR":
    case "FAILED": // legacy: judged before the distinct verdicts existed
    case "CONSTRAINT_VIOLATION":
      return "rejected";
    case "PENDING":
    case "RUNNING":
    case "PENDING_CONSTRAINT_CLASSIFICATION":
      return "pending";
    // The judge dead-letters submissions it couldn't run into ERROR, so
    // penalising it would punish participants for judge faults. Compile
    // errors aren't penalised either (ICPC convention).
    case "ERROR":
    case "COMPILATION_ERROR":
    // Withdrawn by its author before the judge ran it.
    case "CANCELED":
      return "ignored";
  }
}

export type StandingsContest = {
  startDate: Date | null;
  endDate: Date | null;
};

export type StandingsParticipant = {
  id: string;
  name: string;
  username: string;
  image: string | null;
};

export type StandingsSubmission = {
  id: string;
  userId: string;
  problemId: string;
  status: Submission["status"];
  createdAt: Date;
};

export type StandingsInput = {
  contest: StandingsContest;
  // In contest order.
  problemIds: string[];
  participants: StandingsParticipant[];
  submissions: StandingsSubmission[];
};

export type Cell =
  | { state: "untouched" }
  | { state: "pending"; attempts: number }
  | { state: "attempted"; attempts: number }
  | {
      state: "solved";
      attempts: number;
      minute: number;
      firstSolve: boolean;
    };

export type StandingsRow = {
  rank: number;
  user: StandingsParticipant;
  solved: number;
  penalty: number;
  cells: Record<string, Cell>;
};

export type StandingsProblem = {
  problemId: string;
  letter: string;
  firstSolveUserIds: string[];
};

export type Standings = {
  problems: StandingsProblem[];
  rows: StandingsRow[];
};

function inWindow(contest: StandingsContest, at: Date) {
  if (contest.startDate && at < contest.startDate) return false;
  if (contest.endDate && at > contest.endDate) return false;
  return true;
}

function minutesFromStart(contest: StandingsContest, at: Date) {
  if (!contest.startDate) return 0;
  return Math.max(
    0,
    Math.floor((at.getTime() - contest.startDate.getTime()) / 60_000),
  );
}

const key = (userId: string, problemId: string) => `${userId}:${problemId}`;

function byCreatedAt(a: StandingsSubmission, b: StandingsSubmission) {
  return a.createdAt.getTime() - b.createdAt.getTime();
}

/**
 * Ids of submissions that count toward standings: inside the contest window,
 * not ERROR, and not after the participant's first in-window PASSED on that
 * problem. Shared with the export so both agree on what "counted" means.
 */
export function countedSubmissionIds(
  contest: StandingsContest,
  submissions: StandingsSubmission[],
): Set<string> {
  const counted = new Set<string>();
  const solved = new Set<string>();
  for (const s of [...submissions].sort(byCreatedAt)) {
    const k = key(s.userId, s.problemId);
    if (solved.has(k)) continue;
    if (!inWindow(contest, s.createdAt)) continue;
    const cls = classifyStatus(s.status);
    if (cls === "ignored") continue;
    counted.add(s.id);
    if (cls === "solved") solved.add(k);
  }
  return counted;
}

export function computeStandings(input: StandingsInput): Standings {
  const { contest, problemIds, participants } = input;
  const problemSet = new Set(problemIds);
  const participantSet = new Set(participants.map((p) => p.id));
  const counted = countedSubmissionIds(contest, input.submissions);

  const grouped = new Map<string, StandingsSubmission[]>();
  for (const s of [...input.submissions].sort(byCreatedAt)) {
    if (!counted.has(s.id)) continue;
    if (!problemSet.has(s.problemId) || !participantSet.has(s.userId)) continue;
    const k = key(s.userId, s.problemId);
    const list = grouped.get(k);
    if (list) list.push(s);
    else grouped.set(k, [s]);
  }

  // Earliest PASSED per problem → first solve(s).
  const firstSolveAt = new Map<string, number>();
  for (const list of grouped.values()) {
    const passed = list.find((s) => s.status === "PASSED");
    if (!passed) continue;
    const t = passed.createdAt.getTime();
    const prev = firstSolveAt.get(passed.problemId);
    if (prev === undefined || t < prev) firstSolveAt.set(passed.problemId, t);
  }

  const firstSolveUserIds = new Map<string, string[]>(
    problemIds.map((id) => [id, []]),
  );

  const unranked = participants.map((user) => {
    const cells: Record<string, Cell> = {};
    let solved = 0;
    let penalty = 0;

    for (const problemId of problemIds) {
      const list = grouped.get(key(user.id, problemId)) ?? [];
      const passed = list.find((s) => s.status === "PASSED");
      const rejected = list.filter(
        (s) => classifyStatus(s.status) === "rejected",
      ).length;

      if (passed) {
        const minute = minutesFromStart(contest, passed.createdAt);
        const firstSolve =
          firstSolveAt.get(problemId) === passed.createdAt.getTime();
        if (firstSolve) firstSolveUserIds.get(problemId)?.push(user.id);
        cells[problemId] = {
          state: "solved",
          attempts: rejected + 1,
          minute,
          firstSolve,
        };
        solved += 1;
        penalty += minute + rejected * PENALTY_PER_REJECTION_MIN;
      } else if (list.some((s) => classifyStatus(s.status) === "pending")) {
        cells[problemId] = { state: "pending", attempts: rejected };
      } else if (rejected > 0) {
        cells[problemId] = { state: "attempted", attempts: rejected };
      } else {
        cells[problemId] = { state: "untouched" };
      }
    }

    return { user, solved, penalty, cells };
  });

  unranked.sort(
    (a, b) =>
      b.solved - a.solved ||
      a.penalty - b.penalty ||
      a.user.name.localeCompare(b.user.name),
  );

  // Standard competition ranking: 1, 2, 2, 4.
  const rows: StandingsRow[] = [];
  unranked.forEach((r, i) => {
    const prev = rows[i - 1];
    const tied = prev && prev.solved === r.solved && prev.penalty === r.penalty;
    rows.push({ ...r, rank: tied ? prev.rank : i + 1 });
  });

  return {
    problems: problemIds.map((problemId, i) => ({
      problemId,
      letter: letters[i] ?? String(i + 1),
      firstSolveUserIds: firstSolveUserIds.get(problemId) ?? [],
    })),
    rows,
  };
}
