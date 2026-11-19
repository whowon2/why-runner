import { type QueryKey, useQuery } from "@tanstack/react-query";
import { useEffect, useEffectEvent, useRef } from "react";
import { judgePoll, judgeQueryInterval, type PollRow } from "@/lib/judge-poll";
import { isPendingStatus } from "@/lib/submission-status";

/**
 * A query whose rows the judge fills in (runs, submissions, validations,
 * parsons checks), polled on the shared judge-result schedule
 * (`lib/judge-poll.ts`): fast while young, backing off, never while nothing
 * is pending, the data is missing or the fetch failed, and stopping after
 * five minutes. `stuck` is true once polling stopped with a row still
 * pending; offer Check again (`query.refetch()`).
 */
export function useJudgeQuery<T>({
  queryKey,
  queryFn,
  enabled,
  rows,
}: {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  enabled?: boolean;
  /** The rows of `data` the schedule watches. */
  rows: (data: T | undefined) => PollRow[];
}) {
  const query = useQuery({
    queryKey,
    queryFn,
    enabled,
    refetchInterval: (q) => judgeQueryInterval(q.state, rows(q.state.data)),
  });
  // Reading `dataUpdatedAt` also re-renders when a refetch returns the same
  // rows, which is when polling stops.
  const stuck = judgePoll.stuck(rows(query.data), query.dataUpdatedAt);
  return { query, stuck };
}

type SubmissionLike = {
  id: string;
  createdAt: Date | string;
  status: Parameters<typeof isPendingStatus>[0];
};

/** Schedule rows for a submission list. */
export const submissionRows = (
  list: readonly SubmissionLike[] | null | undefined,
): PollRow[] =>
  (list ?? []).map((s) => ({
    id: s.id,
    createdAt: s.createdAt,
    pending: isPendingStatus(s.status),
  }));

/**
 * Calls `onVerdict` when a submission in `list` goes from pending to a final
 * status, so views derived from it (contest status, leaderboard, history)
 * refresh without timers of their own.
 */
export function useVerdictTransition(
  list: readonly SubmissionLike[] | null | undefined,
  onVerdict: () => void,
) {
  const previous = useRef<Map<string, boolean> | null>(null);
  const fire = useEffectEvent(onVerdict);

  useEffect(() => {
    if (!list) return;
    const current = new Map(
      list.map((s) => [s.id, isPendingStatus(s.status)] as const),
    );
    const before = previous.current;
    previous.current = current;
    if (!before) return;
    for (const [id, pending] of current) {
      if (!pending && before.get(id) === true) {
        fire();
        return;
      }
    }
  }, [list]);
}
