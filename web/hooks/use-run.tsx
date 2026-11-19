import { useJudgeQuery } from "@/hooks/use-judge-query";
import { getRun, type RunResult } from "@/lib/actions/runs/get-run";
import { judgePoll, type PollRow } from "@/lib/judge-poll";

const runRows = (run: RunResult | null | undefined): PollRow[] =>
  run
    ? [
        {
          id: run.id,
          createdAt: run.createdAt,
          pending: run.status === "PENDING" || run.status === "RUNNING",
        },
      ]
    : [];

/** Next poll delay for a run fetched at `at`, or `false` to stop. */
export const runPollMs = (run: RunResult, at: number) =>
  judgePoll.interval(runRows(run), at);

/**
 * A run's result, polled on the judge-result schedule until the judge
 * finishes it. `data` is null when the run is gone (deleted or not the
 * user's); `stuck` is true once polling stopped with the run still pending.
 */
export const useRun = (runId: string | null) =>
  useJudgeQuery({
    queryKey: ["code-run", runId],
    queryFn: () => getRun(runId as string),
    enabled: runId !== null,
    rows: runRows,
  });
