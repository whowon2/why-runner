"use client";

import type { Contest } from "@/drizzle/schema";
import { EditContest } from "./edit/edit";
import { PendingJoins } from "./pending-joins";
import { ContestSubmissions } from "./submissions";

export function ContestManagement({ contest }: { contest: Contest }) {
  return (
    <div className="flex flex-col gap-4">
      {new Date() < contest.startDate && <EditContest contestId={contest.id} />}

      {contest.isPrivate && <PendingJoins contestId={contest.id} />}

      <ContestSubmissions contest={contest} />
    </div>
  );
}
