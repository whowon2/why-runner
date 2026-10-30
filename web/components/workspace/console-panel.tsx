"use client";

import { Loader } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { RunPanel } from "@/components/code-run/code-run";
import { StatusBadge } from "@/components/submissions/status-badge";
import { SubmissionDetails } from "@/components/submissions/submission-details";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRun } from "@/hooks/use-run";
import { outputsMatch } from "@/lib/compare-output";
import { isPendingStatus } from "@/lib/submission-status";
import { cn } from "@/lib/utils";
import { AiHelpButton } from "./ai-help-button";
import { MatchBadge } from "./match-badge";
import { useWorkspace } from "./workspace-context";

/**
 * Bottom of the statement column (or the Results view on narrow screens):
 * "Output" shows the latest example play or submission, "Custom input" holds
 * the custom-run stdin box and its result.
 */
export function ConsoleBody({ className }: { className?: string }) {
  const t = useTranslations("Workspace.Console");
  const { event, source, runner, attention, language } = useWorkspace();
  const [tab, setTab] = useState(event?.type === "run" ? "input" : "output");

  // Follow the newest event: a custom run lives on the input tab.
  const [seen, setSeen] = useState(attention);
  if (seen !== attention) {
    setSeen(attention);
    setTab(event?.type === "run" ? "input" : "output");
  }

  return (
    <Tabs
      className={cn("min-h-0 gap-2", className)}
      onValueChange={setTab}
      value={tab}
    >
      <TabsList className="h-8 rounded-none">
        <TabsTrigger className="rounded-none text-xs" value="output">
          {t("output")}
        </TabsTrigger>
        {source.runsEnabled && (
          <TabsTrigger className="rounded-none text-xs" value="input">
            {t("customInput")}
          </TabsTrigger>
        )}
      </TabsList>
      <TabsContent className="min-h-0 overflow-y-auto" value="output">
        <OutputView />
      </TabsContent>
      {source.runsEnabled && (
        <TabsContent className="min-h-0 overflow-y-auto" value="input">
          <RunPanel language={language} runner={runner} />
        </TabsContent>
      )}
    </Tabs>
  );
}

function OutputView() {
  const t = useTranslations("Workspace.Console");
  const { event } = useWorkspace();

  if (!event || event.type === "run") {
    return <p className="text-muted-foreground text-sm">{t("empty")}</p>;
  }
  if (event.type === "example") return <ExampleOutput index={event.index} />;
  return <SubmissionOutput previousId={event.previousId} />;
}

export function ExampleOutput({ index }: { index: number }) {
  const t = useTranslations("Workspace.Console");
  const tStatus = useTranslations("CodeRunStatus");
  const { source, examples } = useWorkspace();
  const test = source.tests.find((x) => x.index === index);
  const play = examples.plays[index];
  const { data: run } = useRun(play?.runId ?? null);

  if (!test) return null;
  const finished = run && !["PENDING", "RUNNING"].includes(run.status);
  const match =
    finished && run.status === "OK"
      ? outputsMatch(
          source.compare.mode,
          source.compare.epsilon,
          run.stdout ?? "",
          test.output,
        )
      : null;

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{t("example", { index })}</span>
        {!finished ? (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Loader className="size-3.5 animate-spin" />
            {t("running")}
          </span>
        ) : run.status === "OK" ? (
          <MatchBadge match={match} />
        ) : (
          <span className="font-medium text-destructive">
            {tStatus(run.status)}
          </span>
        )}
        {finished && run.runtimeMs !== null && (
          <span className="text-muted-foreground text-xs">
            {run.runtimeMs} ms
          </span>
        )}
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <Block label={t("input")} text={test.input} />
        <Block label={t("expected")} text={test.output} />
      </div>
      {finished && (
        <Block
          label={
            run.status === "COMPILATION_ERROR"
              ? t("compilerOutput")
              : t("yourOutput")
          }
          text={
            run.status === "COMPILATION_ERROR"
              ? (run.stderr ?? "")
              : (run.stdout ?? "")
          }
        />
      )}
      {finished && run.status !== "COMPILATION_ERROR" && run.stderr && (
        <Block label={t("stderr")} text={run.stderr} />
      )}
      {match === null && finished && run.status === "OK" && (
        <p className="text-muted-foreground text-xs">{t("checkerNoVerdict")}</p>
      )}
    </div>
  );
}

function SubmissionOutput({ previousId }: { previousId: string | null }) {
  const t = useTranslations("Workspace.Console");
  const { source } = useWorkspace();
  const latest = source.submissions?.[0];
  const isNew = latest && latest.id !== previousId;

  if (!isNew && source.submitting) {
    return (
      <p className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader className="size-4 animate-spin" />
        {t("sending")}
      </p>
    );
  }
  if (!latest)
    return <p className="text-muted-foreground text-sm">{t("empty")}</p>;

  const pending = isPendingStatus(latest.status);
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{t("submission")}</span>
        <StatusBadge status={latest.status} />
        <span className="text-muted-foreground text-xs">
          {latest.createdAt.toLocaleTimeString()}
        </span>
        <AiHelpButton submission={latest} />
      </div>
      {pending ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Loader className="size-4 animate-spin" />
          {t("judging")}
        </p>
      ) : (
        <SubmissionDetails
          constraintViolationDetail={latest.constraintViolationDetail}
          output={latest.output}
          status={latest.status}
        />
      )}
    </div>
  );
}

function Block({ label, text }: { label: string; text: string }) {
  const t = useTranslations("Workspace.Console");
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <pre
        className="notranslate max-h-48 overflow-auto border bg-muted/50 p-2 font-mono text-xs whitespace-pre-wrap break-all"
        translate="no"
      >
        {text || (
          <span className="text-muted-foreground">{t("emptyText")}</span>
        )}
      </pre>
    </div>
  );
}
