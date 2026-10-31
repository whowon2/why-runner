"use client";

import { CircleDashed, Loader, Lock, Play, Terminal } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { VisibleTest } from "@/lib/judge-report";
import { useRun } from "@/hooks/use-run";
import { outputsMatch } from "@/lib/compare-output";
import { cn } from "@/lib/utils";
import { MatchBadge } from "./match-badge";
import { useWorkspace } from "./workspace-context";

/**
 * The visible examples, each with Play and its latest play's result. Runs are
 * allowed where submitting isn't (custom-run spec: due date, solved), so Play
 * ignores the editor's lock.
 */
export function TestCasesPanel({ onSelect }: { onSelect?: () => void }) {
  const t = useTranslations("Workspace.Tests");
  const { source } = useWorkspace();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PanelTitle>{t("title")}</PanelTitle>
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
        {source.runsEnabled && <CustomInputRow onSelect={onSelect} />}
        {source.tests.length === 0 && (
          <p className="flex items-center gap-2 p-2 text-muted-foreground text-sm">
            <Lock className="size-4" />
            {t("noneVisible")}
          </p>
        )}
        {source.tests.map((test) => (
          <TestRow key={test.index} onSelect={onSelect} test={test} />
        ))}
        {source.hiddenCount > 0 && source.tests.length > 0 && (
          <p className="px-2 pt-1 text-muted-foreground text-xs">
            {t("hidden", { count: source.hiddenCount })}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Run with the viewer's own stdin. The row opens the console's input box;
 * Play runs it, or just opens the box while it's still empty.
 */
function CustomInputRow({ onSelect }: { onSelect?: () => void }) {
  const t = useTranslations("Workspace.Tests");
  const tStatus = useTranslations("CodeRunStatus");
  const { runner, event, openCustomInput, runCustom } = useWorkspace();
  const run = runner.result.data;
  const selected = event?.type === "run";

  let result: ReactNode = (
    <span className="text-muted-foreground text-xs">{t("customHint")}</span>
  );
  if (runner.running) {
    result = <Loader className="size-4 animate-spin text-muted-foreground" />;
  } else if (runner.runId && run) {
    result = (
      <span
        className={cn(
          "font-medium text-xs",
          run.status === "OK" ? "text-success" : "text-destructive",
        )}
      >
        {tStatus(run.status)}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 border border-dashed px-2 py-1.5 text-sm transition-colors hover:bg-muted/60",
        selected && "border-primary bg-primary/10 hover:bg-primary/10",
      )}
    >
      <button
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        onClick={() => {
          openCustomInput();
          onSelect?.();
        }}
        type="button"
      >
        <span
          className={cn(
            "flex w-8 shrink-0 justify-center bg-muted py-0.5 text-muted-foreground",
            selected && "bg-primary text-primary-foreground",
          )}
        >
          <Terminal className="size-3.5" />
        </span>
        <span className="truncate">{t("custom")}</span>
        <span className="ml-auto text-sm">{result}</span>
      </button>
      <Button
        aria-label={t("playCustom")}
        disabled={runner.running}
        onClick={() => {
          if (runner.stdin.trim()) runCustom();
          else openCustomInput();
          onSelect?.();
        }}
        size="sm"
        title={t("playCustom")}
        variant="outline"
      >
        <Play />
        <span className="hidden xl:inline">{t("playShort")}</span>
      </Button>
    </div>
  );
}

function TestRow({
  test,
  onSelect,
}: {
  test: VisibleTest;
  onSelect?: () => void;
}) {
  const t = useTranslations("Workspace.Tests");
  const tStatus = useTranslations("CodeRunStatus");
  const { source, examples, event, setEvent, playExamples } = useWorkspace();
  const play = examples.plays[test.index];
  const { data: run } = useRun(play?.runId ?? null);
  const running = !!play && !play.done;
  const selected = event?.type === "example" && event.index === test.index;

  let result: ReactNode = (
    <span className="flex items-center gap-1 text-muted-foreground text-xs">
      <CircleDashed className="size-3.5" />
      {t("notRun")}
    </span>
  );
  if (running) {
    result = <Loader className="size-4 animate-spin text-muted-foreground" />;
  } else if (play?.done && run) {
    result =
      run.status === "OK" ? (
        <MatchBadge
          match={outputsMatch(
            source.compare.mode,
            source.compare.epsilon,
            run.stdout ?? "",
            test.output,
          )}
        />
      ) : (
        <span className="font-medium text-destructive text-xs">
          {tStatus(run.status)}
        </span>
      );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 border px-2 py-1.5 text-sm transition-colors hover:bg-muted/60",
        selected && "border-primary bg-primary/10 hover:bg-primary/10",
      )}
    >
      <button
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        onClick={() => {
          setEvent({ type: "example", index: test.index });
          onSelect?.();
        }}
        type="button"
      >
        <span
          className={cn(
            "w-8 shrink-0 bg-muted py-0.5 text-center font-mono text-muted-foreground text-xs",
            selected && "bg-primary text-primary-foreground",
          )}
        >
          {String(test.index).padStart(2, "0")}
        </span>
        <span className="truncate">{t("example", { index: test.index })}</span>
        <span className="ml-auto text-sm">{result}</span>
      </button>
      {source.runsEnabled && (
        <Button
          aria-label={t("play", { index: test.index })}
          disabled={examples.busy}
          onClick={() => playExamples([test.index])}
          size="sm"
          title={t("play", { index: test.index })}
          variant="outline"
        >
          <Play />
          <span className="hidden xl:inline">{t("playShort")}</span>
        </Button>
      )}
    </div>
  );
}

export function PanelTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-9 shrink-0 items-center border-b bg-muted/40 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
      {children}
    </div>
  );
}
