"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useContest } from "@/hooks/use-contest";
import { EditContestForm } from "./form";
import { EditContestProblems } from "./problems";

export function EditContest({ contestId }: { contestId: string }) {
  const t = useTranslations("ContestsPage.Tabs.Management.EditContest");
  const tTabs = useTranslations("ContestsPage.Tabs");
  const { data: contest } = useContest(contestId);

  if (!contest) return null;

  return (
    <div className="flex w-full flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("contestSection")}</CardTitle>
        </CardHeader>
        <CardContent>
          <EditContestForm contest={contest} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{tTabs("problems")}</CardTitle>
        </CardHeader>
        <CardContent>
          <EditContestProblems contest={contest} />
        </CardContent>
      </Card>
    </div>
  );
}
