import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { CodeRunStatus } from "@/drizzle/schema";
import { useActionErrorMessage } from "@/hooks/use-action-error-message";
import { unwrap } from "@/lib/action-result";
import { type CreateRunInput, createRun } from "@/lib/actions/runs/create-run";
import { getRun, type RunResult } from "@/lib/actions/runs/get-run";
import type { RunProgram } from "@/components/code-run/code-run";

const IN_PROGRESS: readonly CodeRunStatus[] = ["PENDING", "RUNNING"];
const POLL_MS = 1000;

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

  // Polls through the same cache key as `useRun`, so the console showing
  // this run reads the same data without a second request stream.
  async function waitForRun(runId: string): Promise<RunResult> {
    for (;;) {
      const run = await queryClient.fetchQuery({
        queryKey: ["code-run", runId],
        queryFn: () => getRun(runId),
        staleTime: 0,
      });
      if (!IN_PROGRESS.includes(run.status)) return run;
      await new Promise((resolve) => setTimeout(resolve, POLL_MS));
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
      await waitForRun(id);
      setPlays((prev) => ({ ...prev, [index]: { runId: id, done: true } }));
      return true;
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
    const current = ++batch.current;
    setBusy(true);
    try {
      for (const example of examples) {
        if (batch.current !== current) break;
        const ok = await playOne(example.index, program, example.input, (id) =>
          onStarted?.(example.index, id),
        );
        // A refused run (rate limit, …) would refuse the rest too.
        if (!ok) break;
      }
    } finally {
      if (batch.current === current) setBusy(false);
    }
  }

  return { plays, busy, play };
}

export type ExampleRuns = ReturnType<typeof useExampleRuns>;
