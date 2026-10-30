"use client";

import { Brain, Maximize2, PanelRight, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { markdownComponents } from "@/components/markdown-components";
import { StatusBadge } from "@/components/submissions/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
import {
  AI_ASSISTANCE_LEVELS,
  type AiAssistance,
  type Submission,
} from "@/drizzle/schema";
import { useActionErrorMessage } from "@/hooks/use-action-error-message";
import { useAIHelp } from "@/hooks/use-ai-help";
import { isActionError } from "@/lib/action-result";
import type { AiHintLevel } from "@/lib/prompt";
import { useAiHelpDock } from "./ai-help-dock";

/**
 * The hint steps to offer, in order. `null` is the single free-form hint used
 * outside contests. Contest failures climb the ladder up to `maxLevel`;
 * passed contest submissions get one (optimization) response.
 */
function getSteps(
  maxLevel: AiAssistance | null,
  passed: boolean,
): (AiHintLevel | null)[] {
  if (!maxLevel) return [null];
  const enabled = AI_ASSISTANCE_LEVELS.slice(
    1,
    AI_ASSISTANCE_LEVELS.indexOf(maxLevel) + 1,
  ) as AiHintLevel[];
  return passed ? enabled.slice(0, 1) : enabled;
}

function cacheKey(submissionId: string, level: AiHintLevel | null) {
  return level ? `ai-help-${submissionId}-${level}` : `ai-help-${submissionId}`;
}

// Fired after a hint is cached, so the dialog and the docked panel showing
// the same submission stay in sync.
const CACHE_EVENT = "whyrunner:ai-help-cached";

function readCache(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeCache(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode, quota): hint just isn't cached.
  }
  window.dispatchEvent(new Event(CACHE_EVENT));
}

/** Revealed hints for a submission and the action that reveals the next. */
function useAiHints(submission: Submission, maxLevel: AiAssistance | null) {
  const { mutate, isPending } = useAIHelp();
  const errorMessage = useActionErrorMessage();
  const locale = useLocale();
  const t = useTranslations("ContestsPage.Tabs.Problem.Submissions.AI");

  const passed = submission.status === "PASSED";
  const steps = getSteps(maxLevel, passed);
  const [hints, setHints] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // Load cached hints on the client only, after mount, and again whenever
  // another view of the same help caches a new one.
  useEffect(() => {
    function load() {
      const loaded: Record<string, string> = {};
      for (const level of getSteps(maxLevel, passed)) {
        const key = cacheKey(submission.id, level);
        const cached = readCache(key);
        if (cached) loaded[key] = cached;
      }
      setHints(loaded);
    }
    load();
    window.addEventListener(CACHE_EVENT, load);
    return () => window.removeEventListener(CACHE_EVENT, load);
  }, [submission.id, passed, maxLevel]);

  const revealed = steps.filter(
    (level) => hints[cacheKey(submission.id, level)],
  );
  const next = steps.find((level) => !hints[cacheKey(submission.id, level)]);

  function requestNext() {
    if (next === undefined) return;
    setError(null);

    mutate(
      { submissionId: submission.id, level: next ?? "hint", locale },
      {
        onError: (e) => {
          console.error("error", e);
          setError(
            isActionError(e, "RATE_LIMITED") ? errorMessage(e) : t("error"),
          );
        },
        onSuccess: (data) => {
          const helpText = data ?? t("noResponse");
          const key = cacheKey(submission.id, next);
          setHints((prev) => ({ ...prev, [key]: helpText }));
          writeCache(key, helpText);
        },
      },
    );
  }

  return {
    hints,
    revealed,
    next,
    isLadder: steps.length > 1,
    isPending,
    error,
    requestNext,
  };
}

type AiHints = ReturnType<typeof useAiHints>;

/** The revealed hints, in order, scrolling the newest one into view. */
function AiHintList({
  submission,
  state,
}: {
  submission: Submission;
  state: AiHints;
}) {
  const t = useTranslations("ContestsPage.Tabs.Problem.Submissions.AI");
  const tLevels = useTranslations("ContestsPage.AiAssistanceLevels");
  const { hints, revealed, next, isLadder, isPending, error } = state;
  const lastRef = useRef<HTMLDivElement | null>(null);
  const count = revealed.length;
  const previousCount = useRef(count);

  useEffect(() => {
    // Only scroll when a hint was added after the list was first shown.
    if (count > previousCount.current) {
      lastRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    previousCount.current = count;
  }, [count]);

  return (
    <div className="space-y-4 text-sm">
      {revealed.map((level, i) => (
        <div
          className="whitespace-pre-wrap"
          key={level ?? "single"}
          ref={i === revealed.length - 1 ? lastRef : undefined}
        >
          {isLadder && level && (
            <p className="mb-1 font-semibold text-muted-foreground text-xs uppercase">
              {tLevels(`${level}.name`)}
            </p>
          )}
          <ReactMarkdown components={markdownComponents}>
            {hints[cacheKey(submission.id, level)]}
          </ReactMarkdown>
        </div>
      ))}
      {isPending && <p>{t("loading")}</p>}
      {error && <p className="text-destructive">{error}</p>}
      {isLadder && next === undefined && (
        <p className="text-muted-foreground text-xs">{t("maxReached")}</p>
      )}
    </div>
  );
}

function RequestHintButton({ state }: { state: AiHints }) {
  const t = useTranslations("ContestsPage.Tabs.Problem.Submissions.AI");
  if (state.next === undefined) return null;
  return (
    <Button disabled={state.isPending} onClick={state.requestNext}>
      {state.revealed.length > 0 && state.isLadder ? t("next") : t("request")}
    </Button>
  );
}

export function AIDialog({
  submission,
  maxLevel,
  trigger,
}: {
  submission: Submission;
  /** Contest's AI assistance level; `null` outside contests. */
  maxLevel: AiAssistance | null;
  /** Replaces the default "Explain" button. */
  trigger?: ReactNode;
}) {
  const t = useTranslations("ContestsPage.Tabs.Problem.Submissions.AI");
  const state = useAiHints(submission, maxLevel);
  const dock = useAiHelpDock();
  const [open, setOpen] = useState(false);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <Brain className="h-4 w-4" />
            {t("help")}
          </Button>
        )}
      </DialogTrigger>
      {/* Title and buttons stay put; only the hints scroll. */}
      <DialogContent className="flex max-h-[85dvh] flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="-mx-6 min-h-0 flex-1 overflow-y-auto px-6 py-2">
          <AiHintList state={state} submission={submission} />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t("cancel")}</Button>
          </DialogClose>
          {dock.canDock && dock.docked?.submission.id !== submission.id && (
            <Button
              onClick={() => {
                dock.dock({ submission, maxLevel });
                setOpen(false);
              }}
              variant="outline"
            >
              <PanelRight />
              {t("dock")}
            </Button>
          )}
          <RequestHintButton state={state} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The same help as `AIDialog`, rendered in the docked side panel so the
 * student can read it while editing.
 */
export function AiHelpPanelBody({
  submission,
  maxLevel,
}: {
  submission: Submission;
  maxLevel: AiAssistance | null;
}) {
  const state = useAiHints(submission, maxLevel);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <AiHintList state={state} submission={submission} />
      </div>
      <div className="flex justify-end">
        <RequestHintButton state={state} />
      </div>
    </div>
  );
}

/**
 * Third resizable panel, right of the editor, shown while some submission's
 * AI help is docked. Render it inside the page's `ResizablePanelGroup`.
 */
export function AiHelpDockPanel({ order }: { order: number }) {
  const t = useTranslations("ContestsPage.Tabs.Problem.Submissions.AI");
  const { docked, close } = useAiHelpDock();
  if (!docked) return null;

  const { submission, maxLevel } = docked;
  return (
    <>
      <ResizableHandle withHandle />
      <ResizablePanel
        className="flex min-h-0 flex-col gap-3 p-3"
        defaultSize={25}
        id="ai-help"
        minSize={20}
        order={order}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <span className="font-semibold text-sm">{t("title")}</span>
            <span className="flex items-center gap-1 text-muted-foreground text-xs">
              {submission.createdAt.toLocaleTimeString()} ·{" "}
              <StatusBadge status={submission.status} />
            </span>
          </div>
          <div className="flex shrink-0 items-center">
            <AIDialog
              maxLevel={maxLevel}
              submission={submission}
              trigger={
                <Button
                  aria-label={t("openAsDialog")}
                  size="icon"
                  variant="ghost"
                >
                  <Maximize2 />
                </Button>
              }
            />
            <Button
              aria-label={t("closePanel")}
              onClick={close}
              size="icon"
              variant="ghost"
            >
              <X />
            </Button>
          </div>
        </div>
        <AiHelpPanelBody
          key={submission.id}
          maxLevel={maxLevel}
          submission={submission}
        />
      </ResizablePanel>
    </>
  );
}
