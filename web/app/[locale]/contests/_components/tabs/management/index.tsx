"use client";

import type { Contest } from "@/drizzle/schema";
import { Download, FileText, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { ExportContestData } from "./export";
import { Participants } from "./participants";
import { PendingJoins } from "./pending-joins";
import { ContestSubmissions } from "./submissions";

export function ContestManagement({ contest }: { contest: Contest }) {
  const t = useTranslations("ContestsPage.Tabs.Management");

  return (
    <div className="flex flex-col gap-8 w-full mx-auto py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Export */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Download className="w-5 h-5 text-indigo-500" />
          <h2 className="text-xl font-bold tracking-tight">
            {t("exportData")}
          </h2>
        </div>
        <ExportContestData contest={contest} />
      </section>

      {/* People Management */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Users className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-bold tracking-tight">
            {t("peopleManagement")}
          </h2>
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
          <h2 className="text-xl font-bold tracking-tight">
            {t("submissions")}
          </h2>
        </div>
        <div>
          <ContestSubmissions contest={contest} />
        </div>
      </section>
    </div>
  );
}
