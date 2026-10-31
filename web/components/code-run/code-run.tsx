"use client";

import { Check, Copy, Loader, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CodeRunStatus, Language } from "@/drizzle/schema";
import { useActionErrorMessage } from "@/hooks/use-action-error-message";
import { useCreateRun } from "@/hooks/use-create-run";
import { useRun } from "@/hooks/use-run";
import type { CreateRunInput } from "@/lib/actions/runs/create-run";
import { MAX_RUN_STDIN } from "@/lib/submission-limits";
import { cn } from "@/lib/utils";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

/** What to run: the create-run input minus the stdin the panel owns. */
export type RunProgram = DistributiveOmit<CreateRunInput, "stdin">;

const IN_PROGRESS: readonly CodeRunStatus[] = ["PENDING", "RUNNING"];

/**
 * State shared by an editor's `RunButton` (in its toolbar, next to Submit)
 * and its `RunPanel` (under the editor). `defaultStdin` prefills the input,
 * e.g. with an example already shown on the page.
 */
export function useCodeRunner(defaultStdin = "") {
  const t = useTranslations("CodeRun");
  const errorMessage = useActionErrorMessage();
  const [stdin, setStdin] = useState(defaultStdin);
  const [runId, setRunId] = useState<string | null>(null);
  const { mutate, isPending } = useCreateRun();
  const result = useRun(runId);
  const running =
    isPending ||
    (runId !== null &&
      (!result.data || IN_PROGRESS.includes(result.data.status)));

  /** `program` is null when the editor already warned (no language, …). */
  function run(program: RunProgram | null) {
    if (!program) return;
    mutate({ ...program, stdin } as CreateRunInput, {
      onSuccess: ({ id }) => setRunId(id),
      onError: (error) =>
        toast.error(t("failed"), { description: errorMessage(error) }),
    });
  }

  return { stdin, setStdin, runId, result, running, run };
}

export type CodeRunner = ReturnType<typeof useCodeRunner>;

/** `compact` drops the label, for toolbars whose Submit is icon-only. */
export function RunButton({
  runner,
  onRun,
  compact = false,
}: {
  runner: CodeRunner;
  onRun: () => void;
  compact?: boolean;
}) {
  const t = useTranslations("CodeRun");
  return (
    <Button
      disabled={runner.running}
      onClick={onRun}
      title={t("runHint")}
      type="button"
      variant="outline"
    >
      {runner.running ? <Loader className="animate-spin" /> : <Play />}
      {compact ? <span className="sr-only">{t("run")}</span> : t("run")}
    </Button>
  );
}

export function RunPanel({
  runner,
  language,
}: {
  runner: CodeRunner;
  language: Language | null;
}) {
  const t = useTranslations("CodeRun");
  const tStatus = useTranslations("CodeRunStatus");
  const run = runner.result.data;
  const pending = runner.running;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="code-run-stdin">
          {t("input")}
        </label>
        <Textarea
          className="min-h-20 font-mono text-sm notranslate"
          id="code-run-stdin"
          maxLength={MAX_RUN_STDIN}
          onChange={(e) => runner.setStdin(e.target.value)}
          placeholder={t("inputPlaceholder")}
          spellCheck={false}
          translate="no"
          value={runner.stdin}
        />
        <p className="text-xs text-muted-foreground">
          {t("notGraded")}
          {language === "portugol" && ` ${t("portugolInput")}`}
        </p>
      </div>

      {runner.runId !== null && (
        <div aria-live="polite" className="flex flex-col gap-2 border p-3">
          {pending || !run ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader className="size-4 animate-spin" />
              {t("waiting")}
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span
                  className={cn(
                    "font-medium",
                    run.status === "OK"
                      ? "text-success"
                      : run.status === "ERROR"
                        ? "text-muted-foreground"
                        : "text-destructive",
                  )}
                  data-status={run.status}
                >
                  {tStatus(run.status)}
                </span>
                {run.exitCode !== null && (
                  <span className="text-muted-foreground">
                    {t("exitCode", { code: run.exitCode })}
                  </span>
                )}
                {run.runtimeMs !== null && (
                  <span className="text-muted-foreground">
                    {t("time", { ms: run.runtimeMs })}
                  </span>
                )}
                {run.memoryKb !== null && (
                  <span className="text-muted-foreground">
                    {t("memory", { kb: run.memoryKb })}
                  </span>
                )}
              </div>
              <OutputBlock
                label={t("stdout")}
                text={run.stdout ?? ""}
                truncated={run.stdoutTruncated}
              />
              {run.stderr && (
                <OutputBlock
                  label={
                    run.status === "COMPILATION_ERROR"
                      ? t("compilerOutput")
                      : t("stderr")
                  }
                  text={run.stderr}
                  truncated={run.stderrTruncated}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function OutputBlock({
  label,
  text,
  truncated,
}: {
  label: string;
  text: string;
  truncated: boolean;
}) {
  const t = useTranslations("CodeRun");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked (permissions, insecure context): no-op.
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        {text && (
          <Button
            aria-label={t("copy")}
            className="size-6"
            onClick={copy}
            size="icon"
            type="button"
            variant="ghost"
          >
            {copied ? <Check /> : <Copy />}
          </Button>
        )}
      </div>
      <pre
        className="max-h-64 overflow-auto bg-muted p-2 text-xs whitespace-pre-wrap break-all notranslate"
        translate="no"
      >
        {text || <span className="text-muted-foreground">{t("empty")}</span>}
      </pre>
      {truncated && (
        <p className="text-xs text-muted-foreground">{t("truncated")}</p>
      )}
    </div>
  );
}
