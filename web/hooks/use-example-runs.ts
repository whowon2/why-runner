import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { CodeRunStatus } from "@/drizzle/schema";
import { useActionErrorMessage } from "@/hooks/use-action-error-message";
import { unwrap } from "@/lib/action-result";
import { cancelRun } from "@/lib/actions/runs/cancel-run";
import { type CreateRunInput, createRun } from "@/lib/actions/runs/create-run";
import { getRun, type RunResult } from "@/lib/actions/runs/get-run";
import type { RunProgram } from "@/components/code-run/code-run";
import { runPollMs } from "@/hooks/use-run";

const IN_PROGRESS: readonly CodeRunStatus[] = ["PENDING", "RUNNING"];

/** One example's latest play: `runId` is null while the run is being created. */
export type ExamplePlay = { runId: string | null; done: boolean };

/**
 * "Play" for the workspace's visible examples. Each play is an ordinary
 * custom run (`code_run`) whose stdin is the example input the page already
 * shows; the expected output never leaves the browser (custom-run spec).
 * The comparison itself happens where the result is shown
 * (`outputsMatch`). Only one run may be in flight per user, so `play`
 * runs several examples one after another.
 */
export function useExampleRuns() {
  const t = useTranslations("CodeRun");
  const errorMessage = useActionErrorMessage();
  const queryClient = useQueryClient();
  const [plays, setPlays] = useState<Record<number, ExamplePlay>>({});
  const [busy, setBusy] = useState(false);
  // Bumped on every new play batch, so a stale `playAll` loop stops.
  const batch = useRef(0);
  // The run currently being waited on, so `cancel` can withdraw it.
  const current = useRef<string | null>(null);

  // Polls through the same cache key as `useRun`, so the console showing
  // this run reads the same data without a second request stream. Waits on
  // the judge-result schedule: resolves with the finished run, with the
  // still-pending run once the schedule gives up, or null if it is gone.
  async function waitForRun(runId: string): Promise<RunResult | null> {
    for (;;) {
      const run = await queryClient.fetchQuery({
        queryKey: ["code-run", runId],
        queryFn: () => getRun(runId),
        staleTime: 0,
      });
      if (!run || !IN_PROGRESS.includes(run.status)) return run;
      const at = queryClient.getQueryState(["code-run", runId])?.dataUpdatedAt;
      const delay = runPollMs(run, at ?? Date.now());
      if (delay === false) return run;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  async function playOne(
    index: number,
    program: RunProgram,
    stdin: string,
    onStarted?: (runId: string) => void,
  ): Promise<boolean> {
    setPlays((prev) => ({ ...prev, [index]: { runId: null, done: false } }));
    try {
      const { id } = unwrap(
        await createRun({ ...program, stdin } as CreateRunInput),
      );
      setPlays((prev) => ({ ...prev, [index]: { runId: id, done: false } }));
      onStarted?.(id);
      current.current = id;
      const run = await waitForRun(id);
      setPlays((prev) => ({ ...prev, [index]: { runId: id, done: true } }));
      // A run the judge never finished: the rest of the batch would wait
      // just as long, so stop here (the console shows "still judging").
      return run !== null && !IN_PROGRESS.includes(run.status);
    } catch (error) {
      setPlays((prev) => {
        const { [index]: _, ...rest } = prev;
        return rest;
      });
      toast.error(t("failed"), { description: errorMessage(error) });
      return false;
    }
  }

  /**
   * `program` is null when the editor already warned (no language, …).
   * `onStarted` is told each run id as it is created (e.g. to show it in
   * the console).
   */
  async function play(
    examples: { index: number; input: string }[],
    program: RunProgram | null,
    onStarted?: (index: number, runId: string) => void,
  ) {
    if (!program || busy || examples.length === 0) return;
    const thisBatch = ++batch.current;
    setBusy(true);
    try {
      for (const example of examples) {
        if (batch.current !== thisBatch) break;
        const ok = await playOne(example.index, program, example.input, (id) =>
          onStarted?.(example.index, id),
        );
        // A refused run (rate limit, …) would refuse the rest too, and a
        // stuck one would leave the rest waiting as long.
        if (!ok) break;
      }
    } finally {
      if (batch.current === thisBatch) setBusy(false);
    }
  }

  /**
   * Stops the batch: no further example starts, and the run being waited on
   * is withdrawn if no judge has claimed it yet (a claimed one just
   * finishes). Its play then shows `CANCELED` instead of polling forever.
   */
  async function cancel() {
    batch.current++;
    setBusy(false);
    const runId = current.current;
    if (!runId) return;
    const result = await cancelRun(runId);
    // ALREADY_RUNNING is fine: that run will finish on its own.
    if (result.ok) {
      queryClient.invalidateQueries({ queryKey: ["code-run", runId] });
    }
  }

  return { plays, busy, play, cancel };
}

export type ExampleRuns = ReturnType<typeof useExampleRuns>;
