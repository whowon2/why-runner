"use client";

import { AlertTriangle, ListOrdered } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Contest } from "@/drizzle/schema";
import { useContest } from "@/hooks/use-contest";
import { DeleteContest } from "./delete-contest";
import { EditContestForm } from "./form";
import { EditContestProblems } from "./problems";
import { PublishContest } from "./publish-button";

export function ContestSettings({ contestId }: { contestId: string }) {
  const { data: contest } = useContest(contestId);
  const t = useTranslations("ContestsPage.Tabs.Settings");
  const tTabs = useTranslations("ContestsPage.Tabs");

  if (!contest) return null;

  const canDelete =
    contest.status === "draft" ||
    !contest.startDate ||
    new Date() < new Date(contest.startDate);

  return (
    <div className="flex flex-col gap-8 w-full mx-auto py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{tTabs("problems")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <EditContestForm contest={contest as Contest} />
            {contest.status === "draft" && (
              <PublishContest contest={contest} />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <ListOrdered className="w-5 h-5 text-purple-500" />
          <h2 className="text-xl font-bold tracking-tight">
            {tTabs("problems")}
          </h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <EditContestProblems contest={contest} />
          </CardContent>
        </Card>
      </section>

      {canDelete && (
        <section className="space-y-4 pt-6 mt-6 border-t border-rose-500/20">
          <div className="flex items-center gap-2 px-1 text-rose-600 dark:text-rose-500">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-xl font-bold tracking-tight">
              {t("dangerZone")}
            </h2>
          </div>
          <div className="p-6 rounded-none border border-rose-500/30 bg-rose-500/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="max-w-xl">
                <h3 className="text-lg font-semibold text-rose-600 dark:text-rose-400 mb-1">
                  {t("deleteContest")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("deleteWarning")}
                </p>
              </div>
              <div className="shrink-0">
                <DeleteContest contestId={contest.id} />
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
