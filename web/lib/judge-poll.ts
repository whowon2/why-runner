/**
 * How the web waits for judge results (runs, submissions, validations,
 * parsons checks): an age-based polling schedule that backs off and stops
 * once a row has been pending for five minutes (`judge-result-polling`
 * spec). Pure module: runs in `bun test`.
 *
 * The age comes from the row's server `createdAt`, so a reload or a second
 * tab continues the same back-off instead of restarting at 1 s. The client
 * clock may be off, so the page also tracks when it first saw each pending
 * row: it always stops after five minutes of watching, and never stops on
 * age alone before it has watched for 30 s.
 */

/** Stop polling a row pending for this long. */
export const POLL_LIMIT_MS = 5 * 60_000;
/** Minimum time a page watches a row before stopping on its age alone. */
export const OBSERVE_GUARD_MS = 30_000;

/** [age below, interval]: 1 s, then 2 s, 5 s and 10 s. */
const BANDS: readonly (readonly [number, number])[] = [
  [10_000, 1_000],
  [60_000, 2_000],
  [120_000, 5_000],
  [POLL_LIMIT_MS, 10_000],
];
const SLOWEST_MS = 10_000;

/**
 * Next poll delay for a pending row `ageMs` old (by its `createdAt`) that
 * this page has watched for `observedMs`, or `false` to stop.
 */
export function nextPollMs(ageMs: number, observedMs: number): number | false {
  if (observedMs >= POLL_LIMIT_MS) return false;
  const age = Math.max(0, ageMs);
  if (age >= POLL_LIMIT_MS) {
    return observedMs >= OBSERVE_GUARD_MS ? false : SLOWEST_MS;
  }
  for (const [below, ms] of BANDS) if (age < below) return ms;
  return SLOWEST_MS;
}

/** One row as the schedule sees it. */
export type PollRow = {
  id: string;
  createdAt: Date | string | number;
  pending: boolean;
};

/**
 * Schedule over a list of rows, remembering when each pending row was first
 * seen. The youngest pending row sets the interval; no pending row = no
 * polling. `now` is the time the data was fetched (`dataUpdatedAt`), so the
 * poll decision and the "still judging" state always agree.
 */
export function createJudgePoll() {
  const firstSeen = new Map<string, number>();

  function youngest(rows: readonly PollRow[], now: number) {
    let best: { age: number; observed: number } | null = null;
    for (const row of rows) {
      if (!row.pending) {
        firstSeen.delete(row.id);
        continue;
      }
      let seen = firstSeen.get(row.id);
      if (seen === undefined || seen > now) {
        seen = now;
        firstSeen.set(row.id, now);
      }
      const age = now - new Date(row.createdAt).getTime();
      if (!best || age < best.age) best = { age, observed: now - seen };
    }
    return best;
  }

  return {
    /** Delay until the next poll, or `false` to stop. */
    interval(rows: readonly PollRow[], now: number): number | false {
      const row = youngest(rows, now);
      return row ? nextPollMs(row.age, row.observed) : false;
    },
    /** A row is still pending but polling has stopped. */
    stuck(rows: readonly PollRow[], now: number): boolean {
      const row = youngest(rows, now);
      return row !== null && nextPollMs(row.age, row.observed) === false;
    },
  };
}

/** The page-wide schedule every judge-result hook shares. */
export const judgePoll = createJudgePoll();

/**
 * `refetchInterval` for a judge-result query: never while it has no data or
 * its last fetch failed, otherwise the shared schedule over `rows`.
 */
export function judgeQueryInterval(
  state: { status: string; data: unknown; dataUpdatedAt: number },
  rows: readonly PollRow[],
): number | false {
  if (state.status === "error" || state.data == null) return false;
  return judgePoll.interval(rows, state.dataUpdatedAt);
}
