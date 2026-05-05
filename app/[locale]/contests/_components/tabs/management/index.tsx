"use client";

import type { Contest } from "@/drizzle/schema";
import { EditContest } from "./edit/edit";
import { ExportContestData } from "./export";
import { Participants } from "./participants";
import { PendingJoins } from "./pending-joins";
import { ContestSubmissions } from "./submissions";

export function ContestManagement({ contest }: { contest: Contest }) {
  return (
    <div className="flex flex-col gap-4">
      {new Date() < contest.startDate && <EditContest contestId={contest.id} />}

      {contest.isPrivate && <PendingJoins contestId={contest.id} />}

      <Participants contestId={contest.id} />

      <ExportContestData contest={contest} />

      <ContestSubmissions contest={contest} />
    </div>
  );
}
