"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { StatusBadge } from "@/components/submissions/status-badge";
import { SubmissionDetails } from "@/components/submissions/submission-details";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Submission } from "@/drizzle/schema";
import { parseReport } from "@/lib/judge-report";
import { isPendingStatus, statusTone } from "@/lib/submission-status";
import { cn } from "@/lib/utils";

type VerdictSubmission = {
  status: Submission["status"];
  code: string;
  output: string | null;
  constraintViolationDetail?: string | null;
  createdAt: Date;
};

/**
 * The newest submission's verdict, shown in an editor toolbar next to the
 * submit button so students don't have to look for it in the list below.
 * Opens the full report in a dialog, which also works over the fullscreen
 * editor.
 */
export function LatestVerdict({
  submission,
}: {
  submission: VerdictSubmission | null | undefined;
}) {
  const t = useTranslations("ContestsPage.Tabs.Problem.Submissions");
  const report = useMemo(
    () => (submission ? parseReport(submission.output) : null),
    [submission],
  );

  if (!submission) return null;

  const pending = isPendingStatus(submission.status);
  const counts =
    !pending && report
      ? `${report.passed_count}/${report.total_tests}`
      : null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          aria-label={t("latestVerdict")}
          className={cn("shrink-0 gap-1.5", statusTone(submission.status))}
          title={t("latestVerdict")}
          variant="outline"
        >
          <StatusBadge status={submission.status} />
          {counts && (
            <span className="text-muted-foreground text-xs tabular-nums">
              {counts}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t("latestVerdictTitle")} ·{" "}
            <StatusBadge className="text-sm" status={submission.status} />
          </DialogTitle>
        </DialogHeader>
        <div className="flex min-w-0 flex-col gap-3">
          <span className="text-muted-foreground text-xs">
            {submission.createdAt.toLocaleTimeString()}
          </span>
          {pending ? (
            <p className="text-muted-foreground text-sm">{t("processing")}</p>
          ) : (
            <SubmissionDetails
              constraintViolationDetail={submission.constraintViolationDetail}
              output={submission.output}
              status={submission.status}
            />
          )}
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-muted-foreground text-xs">
              {t("codeLabel")}
            </span>
            <pre
              className="notranslate max-h-60 overflow-auto rounded-md border bg-muted/50 p-2 font-mono text-xs whitespace-pre"
              translate="no"
            >
              {submission.code}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
