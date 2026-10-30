"use client";

import { Check, Loader, PlayCircle, Terminal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { StatusBadge } from "@/components/submissions/status-badge";
import { Button } from "@/components/ui/button";
import { parseReport } from "@/lib/judge-report";
import { isPendingStatus, statusTone } from "@/lib/submission-status";
import { cn } from "@/lib/utils";
import { AiHelpButton } from "./ai-help-button";
import { PanelTitle } from "./test-cases-panel";
import { useWorkspace } from "./workspace-context";

/** Run / Run all / Submit, plus the newest submission's live verdict. */
export function ActionsPanel({ onAction }: { onAction?: () => void }) {
  const t = useTranslations("Workspace.Actions");
  const {
    source,
    examples,
    runner,
    runCustom,
    playExamples,
    submit,
    setEvent,
  } = useWorkspace();
  const latest = source.submissions?.[0];
  const report = useMemo(
    () => (latest ? parseReport(latest.output) : null),
    [latest],
  );
  const locked = source.lockedReason !== null;

  function act(action: () => void) {
    action();
    onAction?.();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PanelTitle>{t("title")}</PanelTitle>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
        {source.runsEnabled && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              disabled={examples.busy || source.tests.length === 0}
              onClick={() =>
                act(() => playExamples(source.tests.map((x) => x.index)))
              }
              variant="outline"
            >
              {examples.busy ? (
                <Loader className="animate-spin" />
              ) : (
                <PlayCircle />
              )}
              {t("runAll")}
            </Button>
            <Button
              disabled={runner.running}
              onClick={() => act(runCustom)}
              title={t("runCustomHint")}
              variant="outline"
            >
              {runner.running ? (
                <Loader className="animate-spin" />
              ) : (
                <Terminal />
              )}
              {t("runCustom")}
            </Button>
          </div>
        )}
        <Button
          className="h-11"
          disabled={locked || source.submitting}
          onClick={() => act(submit)}
          title={source.lockedReason ?? undefined}
        >
          {source.submitting ? <Loader className="animate-spin" /> : <Check />}
          {t("submit")}
        </Button>
        {locked && (
          <p className="text-muted-foreground text-xs">{source.lockedReason}</p>
        )}
        {latest && (
          <div
            className={cn(
              "flex flex-wrap items-center gap-2 border p-2 text-sm",
              statusTone(latest.status),
            )}
          >
            <span className="text-muted-foreground text-xs">{t("latest")}</span>
            <button
              className="flex items-center gap-2"
              onClick={() =>
                act(() => setEvent({ type: "submission", previousId: null }))
              }
              title={t("showDetails")}
              type="button"
            >
              <StatusBadge status={latest.status} />
              {isPendingStatus(latest.status) ? (
                <Loader className="size-3.5 animate-spin" />
              ) : (
                report && (
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {t("passedCount", {
                      passed: report.passed_count,
                      total: report.total_tests,
                    })}
                  </span>
                )
              )}
            </button>
            <span className="ml-auto">
              <AiHelpButton submission={latest} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
