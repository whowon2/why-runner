"use client";

import type { User } from "better-auth";
import { ArrowLeft, Trophy } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useContest } from "@/hooks/use-contest";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Leaderboard } from "./leaderboard";
import { ContestManagement } from "./management";
import { ProblemTab } from "./problem";

export function ContestTabs({ id, user }: { id: number; user: User }) {
  const { data: contest } = useContest(id);
  const t = useTranslations("ContestsPage");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "problems";

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams],
  );

  const handleTabChange = (value: string) => {
    router.push(`${pathname}?${createQueryString("tab", value)}`, {
      scroll: false, // keeps the page from scrolling to top
    });
  };

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

  return (
    <div className="flex w-full flex-col flex-1 items-center justify-center gap-4 p-4">
      <Tabs
        className="w-full flex-1"
        defaultValue={tab}
        onValueChange={handleTabChange}
      >
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
          {contest.createdBy === user.id && (
            <TabsTrigger
              className="h-full rounded-none border border-transparent border-b-[3px] bg-background data-[state=active]:border-primary data-[state=active]:shadow-none"
              value="manage"
            >
              {t("Tabs.manage")}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent className="flex w-full gap-4" value="problems">
          <ProblemTab contest={contest} user={user} />
        </TabsContent>
        <TabsContent value="leaderboard">
          <Leaderboard contest={contest} />
        </TabsContent>
        {contest.createdBy === user.id && (
          <TabsContent value="manage">
            <ContestManagement contest={contest} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
