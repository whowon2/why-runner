"use client";

import type { User } from "better-auth";
import { RefreshCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { AIDialog } from "@/app/[locale]/contests/_components/ai-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/copy-button";
import { SubmissionDetails } from "@/components/submissions/submission-details";
import { Skeleton } from "@/components/ui/skeleton";
import type { Contest, ProblemPreview } from "@/drizzle/schema";
import { useProblemSubmissions } from "@/hooks/use-problem-submissions";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/submissions/status-badge";
import { isFinalFailure, statusTone } from "@/lib/submission-status";

export function SubmissionList({
  problem,
  contest,
  user,
}: {
  problem: ProblemPreview;
  contest: Contest;
  user: User;
}) {
  const t = useTranslations("ContestsPage.Tabs.Problem.Submissions");
  const {
    data: submissions,
    isPending,
    refetch: refetchSubmissions,
  } = useProblemSubmissions({
    problemId: problem.id,
    contestId: contest.id,
    userId: user.id,
  });

  if (isPending) {
    return <Skeleton className="h-20 w-full" />;
  }

  if (!submissions) {
    return <div>{t("noSubmissions")}</div>;
  }

  return (
    <Card className="max-h-screen w-full overflow-auto bg-transparent shadow-none">
      <CardHeader>
        <CardTitle
          className="flex justify-between flex-wrap gap-2"
          onClick={() => refetchSubmissions()}
        >
          <h1>
            {t("title")} ({submissions.length})
          </h1>
          <Button>
            <RefreshCcw />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="">
        <Accordion className="w-full space-y-2" collapsible type="single">
          {submissions.map((submission) => (
            <AccordionItem
              className={cn(
                "rounded-md border px-4 last:border flex-wrap",
                statusTone(submission.status),
              )}
              key={submission.id}
              value={`item-${submission.id}`}
            >
              <AccordionTrigger className="flex-wrap overflow-hidden">
                <p className="flex-1 text-gray-500 text-sm">
                  {submission.createdAt.toLocaleTimeString()}:
                </p>
                {submission.language && (
                  <p className="text-muted-foreground text-xs">
                    {submission.language}
                  </p>
                )}
                <p className="text-xs">
                  {submission.status ? (
                    <StatusBadge status={submission.status} />
                  ) : (
                    t("processing")
                  )}
                </p>
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-3">
                <SubmittedCode code={submission.code} />
                {submission.output && (
                  <SubmissionDetails
                    constraintViolationDetail={
                      submission.constraintViolationDetail
                    }
                    output={submission.output}
                    status={submission.status}
                  />
                )}
                {contest.aiAssistance !== "off" &&
                  (submission.status === "PASSED" ||
                    isFinalFailure(submission.status)) && (
                    <div className="flex justify-end">
                      <AIDialog
                        maxLevel={contest.aiAssistance}
                        submission={submission}
                      />
                    </div>
                  )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

// Neutral colors on purpose: the accordion item is tinted by status, and the
// code shouldn't inherit that. `whitespace-pre` keeps indentation intact.
function SubmittedCode({ code }: { code: string }) {
  const t = useTranslations("ContestsPage.Tabs.Problem.Submissions");

  return (
    <div className="flex flex-col gap-1 w-full min-w-0 text-foreground">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">
          {t("codeLabel")}
        </span>
        <CopyButton value={code} />
      </div>
      <pre
        translate="no"
        className="notranslate bg-muted/50 border rounded-md p-2 font-mono text-xs whitespace-pre max-h-80 overflow-auto"
      >
        {code}
      </pre>
    </div>
  );
}
