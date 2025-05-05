"use client";

import type { Submission } from "@repo/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { Skeleton } from "../ui/skeleton";

const color = (output: string | null) => {
  if (!output) return "border-card-400";

  if (output === "Submission failed") return "border-destructive";
  const [passed, total] = output.split("/").map(Number);

  if (passed === total) return "border-green-500";
  return "border-card-400";
};

export function SubmissionList({ problemId }: { problemId: string }) {
  const { data: submissions, isPending } = api.submission.find.useQuery({
    problemId,
  });

  if (isPending) {
    return <Skeleton className="w-full h-20" />;
  }

  if (!submissions) {
    return <div>No submissions!</div>;
  }

  return (
    <Card className="w-full max-w-7xl">
      <CardHeader>
        <CardTitle>Submissions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {submissions.length > 0 ? (
            <div className="flex flex-col gap-2">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className={`flex gap-2 border p-2 items-center rounded ${color(submission.output)}`}
                >
                  <p className="text-sm text-gray-500">
                    {submission.createdAt.toLocaleTimeString()}:
                  </p>
                  <p className="text-xs">
                    {submission.output ?? "Processing..."}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm">No submissions found.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
