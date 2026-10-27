import { computeExerciseScore } from "@/lib/exercise-score";

export const PICK_MODES = ["latest", "best"] as const;
export type PickMode = (typeof PICK_MODES)[number];

type Candidate = {
  userId: string;
  status: string;
  createdAt: Date;
  output: string | null;
};

const UNJUDGED = new Set(["PENDING", "RUNNING"]);

/**
 * One submission per student. `latest`: most recent judged one. `best`:
 * most recent PASSED; else highest passed-test fraction (latest on ties).
 * Returned most recent first.
 */
export function pickPerStudent<T extends Candidate>(
  submissions: T[],
  mode: PickMode,
): T[] {
  const byUser = new Map<string, T[]>();
  for (const s of submissions) {
    if (UNJUDGED.has(s.status)) continue;
    const list = byUser.get(s.userId);
    if (list) list.push(s);
    else byUser.set(s.userId, [s]);
  }

  const picked: T[] = [];
  for (const list of byUser.values()) {
    list.sort((x, y) => y.createdAt.getTime() - x.createdAt.getTime());
    if (mode === "latest") {
      picked.push(list[0]);
      continue;
    }
    const passed = list.find((s) => s.status === "PASSED");
    if (passed) {
      picked.push(passed);
      continue;
    }
    let best = list[0];
    let bestScore = computeExerciseScore(best.output);
    for (const s of list.slice(1)) {
      const score = computeExerciseScore(s.output);
      if (score > bestScore) {
        best = s;
        bestScore = score;
      }
    }
    picked.push(best);
  }

  return picked.sort((x, y) => y.createdAt.getTime() - x.createdAt.getTime());
}
