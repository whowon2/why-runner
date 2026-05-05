"use client";

import type { Contest } from "@/drizzle/schema";
import { AlertTriangle, Database, FileText, Settings, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { DeleteContest } from "./delete-contest";
import { EditContest } from "./edit/edit";
import { ExportContestData } from "./export";
import { Participants } from "./participants";
import { PendingJoins } from "./pending-joins";
import { ContestSubmissions } from "./submissions";

export function ContestManagement({ contest }: { contest: Contest }) {
  const beforeStart = new Date() < new Date(contest.startDate);
  const t = useTranslations("ContestsPage.Tabs.Management");

  return (
    <div className="flex flex-col gap-8 w-full mx-auto py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Overview & Settings */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Settings className="w-5 h-5 text-indigo-500" />
          <h2 className="text-xl font-bold tracking-tight">{t("overviewAndSettings")}</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {beforeStart ? (
            <div className="h-full">
              <EditContest contestId={contest.id} />
            </div>
          ) : (
            <div className="p-6 rounded-2xl border bg-muted/20 flex flex-col justify-center items-center text-center h-full min-h-[150px]">
              <p className="text-muted-foreground font-medium">{t("contestAlreadyStarted")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("editingDisabled")}</p>
            </div>
          )}
          <div className="h-full">
            <ExportContestData contest={contest} />
          </div>
        </div>
      </section>

      {/* People Management */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Users className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-bold tracking-tight">{t("peopleManagement")}</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-full">
            <Participants contestId={contest.id} />
          </div>
          {contest.isPrivate && (
            <div className="h-full">
              <PendingJoins contestId={contest.id} />
            </div>
          )}
        </div>
      </section>

      {/* Submissions */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <FileText className="w-5 h-5 text-purple-500" />
          <h2 className="text-xl font-bold tracking-tight">{t("submissions")}</h2>
        </div>
        <div>
          <ContestSubmissions contest={contest} />
        </div>
      </section>

      {/* Danger Zone */}
      {beforeStart && (
        <section className="space-y-4 pt-6 mt-6 border-t border-rose-500/20">
          <div className="flex items-center gap-2 px-1 text-rose-600 dark:text-rose-500">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-xl font-bold tracking-tight">{t("dangerZone")}</h2>
          </div>
          <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-500/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="max-w-xl">
                <h3 className="text-lg font-semibold text-rose-600 dark:text-rose-400 mb-1">{t("deleteContest")}</h3>
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
