"use client";

import type { Session } from "better-auth";
import { ArrowLeft, Pencil, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { BreadCrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useContest } from "@/hooks/use-contest";
import { Link } from "@/i18n/navigation";
import { ContestDescription } from "../description";
import { JoinButton } from "../join";
import { Leaderboard } from "../leaderboard";
import { ContestManagement } from "../management";
import { ContestStatus } from "../status";
import { ProblemTab } from "./problem";

export function ContestTabs({ id, session }: { id: number; session: Session }) {
  const { data: contest } = useContest(id);
  const t = useTranslations("ContestsPage");

  if (!contest) {
    return (
      <div className="flex gap-4 flex-col justify-center items-center min-h-screen">
        {t("notFound")}
        <Link href={"/contests"}>
          <Button className="font-bold">
            <ArrowLeft />
            {t("backToList")}
          </Button>
        </Link>
      </div>
    );
  }

  const isCreatedByUser = contest.createdBy === session.userId;

  return (
    <div className="flex w-full flex-col flex-1 items-center justify-center gap-4 p-4">
      <BreadCrumbs />
      <div className="flex flex-col items-center">
        <div className="flex gap-2">
          <h1 className="font-bold text-3xl text-secondary">{contest.name}</h1>
          {isCreatedByUser && contest.startDate > new Date() && (
            <Link href={`${contest.id}/edit`}>
              <Pencil size={18} />
            </Link>
          )}
        </div>
        <JoinButton
          contest={contest}
          isCreatedByUser={isCreatedByUser}
          session={session}
        />
      </div>

      <ContestStatus contest={contest} />

      <Tabs className="w-full flex-1" defaultValue="problems">
        <TabsList className="w-full justify-start rounded-none border-b bg-background p-0">
          <TabsTrigger
            className="h-full rounded-none border border-transparent border-b-[3px] bg-background data-[state=active]:border-primary data-[state=active]:shadow-none"
            value="problems"
          >
            {t("Tabs.problems")}
          </TabsTrigger>
          <TabsTrigger
            className="h-full rounded-none border border-transparent border-b-[3px] bg-background data-[state=active]:border-primary data-[state=active]:shadow-none"
            value="leaderboard"
          >
            {t("Tabs.leaderboard")}
            <Trophy />
          </TabsTrigger>
          <TabsTrigger
            className="h-full rounded-none border border-transparent border-b-[3px] bg-background data-[state=active]:border-primary data-[state=active]:shadow-none"
            value="description"
          >
            {t("Tabs.description")}
          </TabsTrigger>
          {contest.createdBy === session?.userId && (
            <TabsTrigger
              className="h-full rounded-none border border-transparent border-b-[3px] bg-background data-[state=active]:border-primary data-[state=active]:shadow-none"
              value="manage"
            >
              {t("Tabs.manage")}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent className="flex w-full gap-4" value="problems">
          <ProblemTab contest={contest} session={session} />
        </TabsContent>
        <TabsContent value="leaderboard">
          <Leaderboard contest={contest} />
        </TabsContent>
        <TabsContent value="description">
          <ContestDescription contest={contest} />
        </TabsContent>
        {contest.createdBy === session?.userId && (
          <TabsContent value="manage">
            <ContestManagement contest={contest} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
