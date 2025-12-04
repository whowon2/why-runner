"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useContest } from "@/hooks/use-contest";
import { EditContestForm } from "./form";
import { EditContestProblems } from "./problems";

export function EditContest({ contestId }: { contestId: number }) {
  const { data: contest } = useContest(contestId);

  if (!contest) return null;

  return (
    <div className="flex w-full flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Contest</CardTitle>
        </CardHeader>
        <CardContent>
          <EditContestForm contest={contest} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Problems</CardTitle>
        </CardHeader>
        <CardContent>
          <EditContestProblems contest={contest} />
        </CardContent>
      </Card>
    </div>
  );
}
