"use client";

import { House } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useHomeData } from "@/hooks/use-home-data";
import { LastContestCard } from "./last-contest-card";
import { PendingLessonsCard } from "./pending-lessons-card";
import { RecentSolvesCard } from "./recent-solves-card";
import { RunningContestCard } from "./running-contest-card";
import { SuggestionsCard } from "./suggestions-card";

export function HomeDashboard() {
  const t = useTranslations("Home");
  const { data, isPending } = useHomeData();

  return (
    <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col gap-6 py-8">
      <PageHeader icon={House} title={t("title")} subtitle={t("subtitle")} />

      {isPending || !data ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : (
        <>
          {data.runningContests.length > 0 && (
            <RunningContestCard contests={data.runningContests} />
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PendingLessonsCard lessons={data.pendingLessons} />
            <LastContestCard contest={data.lastJoinedContest} />
            <RecentSolvesCard problems={data.recentSolves} />
            <SuggestionsCard
              problems={data.suggestedProblems}
              contests={data.suggestedContests}
            />
          </div>
        </>
      )}
    </div>
  );
}
