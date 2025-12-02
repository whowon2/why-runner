"use client";

import { RefreshCcw } from "lucide-react";
import { useTranslations } from "next-intl";
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
import type { Problem } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { AIDialog } from "@/app/[locale]/contests/_components/ai-dialog";

export function SubmissionList({ problem }: { problem: Problem }) {
  const t = useTranslations("ContestsPage.Tabs.Problem.Submissions");
  const {
    data: submissions,
    isPending,
    refetch: refetchSubmissions,
  } = useProblemSubmissions({ problemId: problem.id });

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

function SubmissionDetails({ output }: { output: string }) {
  console.log(output);
  console.log(JSON.parse(output));

  const details: {
    passed: boolean;
    tests: string[];
    error: string;
  } = JSON.parse(output);

  return (
    <div>
      {details.tests?.map((t, idx) => (
        <div key={idx}>
          Test {idx}: {t}
        </div>
      ))}
      {details.error}
    </div>
  );
}
