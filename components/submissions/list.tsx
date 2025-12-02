"use client";

import type { Session } from "better-auth";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useProblemSubmissions } from "@/hooks/use-problem-submissions";
import type { Contest, Problem } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export function SubmissionList({
  problem,
  contest,
  session,
}: {
  problem: Problem;
  contest: Contest;
  session: Session;
}) {
  const t = useTranslations("ContestsPage.Tabs.Problem.Submissions");
  const {
    data: submissions,
    isPending,
    refetch: refetchSubmissions,
  } = useProblemSubmissions({
    problemId: problem.id,
    contestId: contest.id,
    userId: session.userId,
  });

  if (isPending) {
    return <Skeleton className="h-20 w-full" />;
  }

  if (!submissions) {
    return <div>No submissions!</div>;
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
              className={cn("rounded-md border px-4 last:border flex-wrap", {
                "text-green-500 border-green-500":
                  submission.status === "PASSED",
                "text-red-500 border-red-500": submission.status === "FAILED",
                "text-orange-500 border-orange-500":
                  submission.status === "ERROR",
                "text-gray-500 border-gray-500":
                  submission.status === "PENDING",
                "text-blue-500 border-blue-500":
                  submission.status === "RUNNING",
              })}
              key={submission.id}
              value={`item-${submission.id}`}
            >
              <AccordionTrigger className="flex-wrap overflow-hidden">
                <p className="flex-1 text-gray-500 text-sm">
                  {submission.createdAt.toLocaleTimeString()}:
                </p>
                <p className="text-xs">
                  {submission.status ?? "Processing..."}
                </p>
              </AccordionTrigger>
              <AccordionContent className="flex justify-between">
                {submission.output && (
                  <SubmissionDetails output={submission.output} />
                )}
                {["PASSED", "FAILED", "ERROR"].includes(submission.status) && (
                  <AIDialog problem={problem} submission={submission} />
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

interface TestCaseResult {
  input: string;
  expected: string;
  actual: string;
  error?: string;
  index: number;
}

interface JudgeReport {
  passed: boolean;
  total_tests: number;
  passed_count: number;
  failure_details?: TestCaseResult;
}

function SubmissionDetails({ output }: { output: string | null }) {
  // 1. Safe JSON Parsing
  const report = useMemo(() => {
    if (!output) return null;
    try {
      const parsed = JSON.parse(output);
      // Simple check to see if it matches our schema
      if ("total_tests" in parsed) {
        return parsed as JudgeReport;
      }
      return null;
    } catch (e) {
      return null;
    }
  }, [output]);

  // 2. Fallback: If it's not JSON (e.g. old logs or raw crash), show text
  if (!report) {
    return (
      <div className="bg-muted p-2 rounded-md text-xs font-mono whitespace-pre-wrap max-h-60 overflow-auto w-full">
        {output || "No output available"}
      </div>
    );
  }

  // 3. Success State
  if (report.passed) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <div className="text-green-500 font-medium">
          🎉 All {report.total_tests} tests passed!
        </div>
      </div>
    );
  }

  // 4. Failure State
  const fail = report.failure_details;
  if (!fail) return <div>Unknown error state</div>;

  return (
    <div className="flex flex-col gap-3 w-full text-sm">
      {/* Summary Header */}
      <div className="font-medium text-red-500 flex items-center gap-2">
        <span>❌ Failed on Test Case #{fail.index}</span>
        <span className="text-gray-500 text-xs font-normal">
          (Passed {report.passed_count}/{report.total_tests})
        </span>
      </div>

      {/* Grid Layout for Inputs/Outputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CodeBlock label="Input" content={fail.input} />
        <CodeBlock label="Your Output" content={fail.actual} />
      </div>

      {/* Expected Output (Full Width) */}
      <CodeBlock label="Expected Output" content={fail.expected} />

      {/* Runtime Errors (Stderr) */}
      {fail.error && (
        <div className="w-full">
          <span className="text-xs font-semibold text-red-500 mb-1 block">
            Error Log (Stderr)
          </span>
          <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 p-2 rounded-md font-mono text-xs whitespace-pre-wrap">
            {fail.error}
          </div>
        </div>
      )}
    </div>
  );
}

function CodeBlock({ label, content }: { label: string; content: string }) {
  return (
    <div className="flex flex-col gap-1 w-full min-w-0">
      <span className="text-xs font-semibold text-gray-500">{label}</span>
      <div className="bg-muted/50 border rounded-md p-2 font-mono text-xs whitespace-pre-wrap break-all h-full max-h-40 overflow-auto">
        {content || <span className="text-gray-400 italic">Empty</span>}
      </div>
    </div>
  );
}
