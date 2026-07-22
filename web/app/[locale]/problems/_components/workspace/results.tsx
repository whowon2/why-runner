"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProblemPracticeSubmissions } from "@/hooks/use-problem-practice-submissions";
import { useProblemTests } from "@/hooks/use-problem-tests";
import { cn } from "@/lib/utils";

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

export function ProblemResultsTab({ problemId }: { problemId: string }) {
  const t = useTranslations("ProblemsPage.Workspace.Results");
  const { data: submissions, isPending } =
    useProblemPracticeSubmissions(problemId);

  if (isPending) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (!submissions || submissions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
        {t("noSubmissions")}
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("time")}</TableHead>
            <TableHead>{t("language")}</TableHead>
            <TableHead>{t("codeSize")}</TableHead>
            <TableHead>{t("result")}</TableHead>
            <TableHead>{t("details")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission) => (
            <TableRow key={submission.id}>
              <TableCell>
                {new Date(submission.createdAt).toLocaleString()}
              </TableCell>
              <TableCell>{submission.language}</TableCell>
              <TableCell>
                {t("chars", {
                  count: submission.codeSize ?? submission.code.length,
                })}
              </TableCell>
              <TableCell
                className={cn({
                  "text-green-500": submission.status === "PASSED",
                  "text-red-500": submission.status === "FAILED",
                  "text-orange-500": submission.status === "ERROR",
                  "text-gray-500": submission.status === "PENDING",
                  "text-blue-500": submission.status === "RUNNING",
                })}
              >
                {submission.status}
              </TableCell>
              <TableCell>
                <SubmissionDetailsDialog
                  code={submission.code}
                  output={submission.output}
                  problemId={problemId}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SubmissionDetailsDialog({
  code,
  output,
  problemId,
}: {
  code: string;
  output: string | null;
  problemId: string;
}) {
  const t = useTranslations("ProblemsPage.Workspace.Results");
  const tTests = useTranslations("ProblemsPage.Workspace.Tests");

  const report = useMemo(() => {
    if (!output) return null;
    try {
      const parsed = JSON.parse(output);
      if ("total_tests" in parsed) return parsed as JudgeReport;
      return null;
    } catch {
      return null;
    }
  }, [output]);

  // Judge's report only carries per-test input/output on failure; on a pass
  // there's nothing test-specific to show, so fall back to the problem's own
  // sample cases as a reference (only fetched when the dialog needs them).
  const { data: tests } = useProblemTests(problemId, {
    enabled: !!report?.passed,
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-sm underline underline-offset-2" type="button">
          {t("details")}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("detailsTitle")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-xs font-semibold text-muted-foreground">
              {t("code")}
            </span>
            <pre className="mt-1 max-h-60 overflow-auto rounded-md border bg-muted/50 p-2 font-mono text-xs whitespace-pre-wrap">
              {code}
            </pre>
          </div>

          {report && !report.passed && report.failure_details && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-semibold text-muted-foreground">
                  {t("inputOutput")}
                </span>
                <pre className="mt-1 max-h-40 overflow-auto rounded-md border bg-muted/50 p-2 font-mono text-xs whitespace-pre-wrap">
                  {report.failure_details.input}
                </pre>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground">
                  {t("inputOutput")}
                </span>
                <pre className="mt-1 max-h-40 overflow-auto rounded-md border bg-muted/50 p-2 font-mono text-xs whitespace-pre-wrap">
                  {report.failure_details.expected}
                </pre>
              </div>
            </div>
          )}

          {report?.passed && tests && tests.samples.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-muted-foreground">
                {tTests("sampleTitle")}
              </span>
              <div className="mt-1 flex flex-col gap-2">
                {tests.samples.map((testCase, i) => (
                  <div
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    key={`sample-${i}-${testCase.input}`}
                  >
                    <div>
                      <span className="text-xs text-muted-foreground">
                        {tTests("input")}
                      </span>
                      <pre className="mt-1 max-h-40 overflow-auto rounded-md border bg-muted/50 p-2 font-mono text-xs whitespace-pre-wrap">
                        {testCase.input}
                      </pre>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">
                        {tTests("output")}
                      </span>
                      <pre className="mt-1 max-h-40 overflow-auto rounded-md border bg-muted/50 p-2 font-mono text-xs whitespace-pre-wrap">
                        {testCase.output}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!report && output && (
            <pre className="max-h-40 overflow-auto rounded-md border bg-muted/50 p-2 font-mono text-xs whitespace-pre-wrap">
              {output}
            </pre>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
