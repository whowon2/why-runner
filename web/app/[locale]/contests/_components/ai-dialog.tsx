"use client";

import { Brain } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
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
import {
  AI_ASSISTANCE_LEVELS,
  type AiAssistance,
  type Submission,
} from "@/drizzle/schema";
import { useAIHelp } from "@/hooks/use-ai-help";
import type { AiHintLevel } from "@/lib/prompt";

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
}

export function AIDialog({
  submission,
  maxLevel,
}: {
  submission: Submission;
  /** Contest's AI assistance level; `null` outside contests. */
  maxLevel: AiAssistance | null;
}) {
  const { mutate, isPending } = useAIHelp();
  const locale = useLocale();
  const t = useTranslations("ContestsPage.Tabs.Problem.Submissions.AI");
  const tLevels = useTranslations("ContestsPage.AiAssistanceLevels");

  const steps = getSteps(maxLevel, submission.status === "PASSED");
  const [hints, setHints] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // Load cached hints on the client only, after mount.
  useEffect(() => {
    const loaded: Record<string, string> = {};
    for (const level of getSteps(maxLevel, submission.status === "PASSED")) {
      const key = cacheKey(submission.id, level);
      const cached = readCache(key);
      if (cached) loaded[key] = cached;
    }
    setHints(loaded);
  }, [submission.id, submission.status, maxLevel]);

  const revealed = steps.filter(
    (level) => hints[cacheKey(submission.id, level)],
  );
  const next = steps.find((level) => !hints[cacheKey(submission.id, level)]);
  const isLadder = steps.length > 1;

  function handle() {
    if (next === undefined) return;
    setError(null);

    mutate(
      { submissionId: submission.id, level: next ?? "hint", locale },
      {
        onError: (e) => {
          console.error("error", e);
          setError(t("error"));
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Brain className="h-4 w-4" />
          {t("help")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="text-sm py-4 space-y-4">
          {revealed.map((level) => (
            <div key={level ?? "single"} className="whitespace-pre-wrap">
              {isLadder && level && (
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                  {tLevels(`${level}.name`)}
                </p>
              )}
              <ReactMarkdown>
                {hints[cacheKey(submission.id, level)]}
              </ReactMarkdown>
            </div>
          ))}
          {isPending && <p>{t("loading")}</p>}
          {error && <p className="text-destructive">{error}</p>}
          {isLadder && next === undefined && (
            <p className="text-xs text-muted-foreground">{t("maxReached")}</p>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t("cancel")}</Button>
          </DialogClose>
          {next !== undefined && (
            <Button onClick={handle} disabled={isPending}>
              {revealed.length > 0 && isLadder ? t("next") : t("request")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
