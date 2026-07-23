"use client";

import type { User } from "better-auth";
import { ArrowLeft, ListOrdered, Lock, Settings, Trophy } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useContest } from "@/hooks/use-contest";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Leaderboard } from "./leaderboard";
import { ContestManagement } from "./management";
import { ProblemTab } from "./problem";
import { ContestSettings } from "./settings";
import { PublishContest } from "./settings/publish-button";

export function ContestTabs({ id, user }: { id: string; user: User }) {
  const { data: contest, isPending } = useContest(id);
  const t = useTranslations("ContestsPage");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabFromQuery = searchParams.get("tab");

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

  if (isPending) {
    return null;
  }

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

  const isOwner = contest.createdBy === user.id;
  const isPublished = contest.status === "published";
  const tab =
    tabFromQuery || (isOwner && !isPublished ? "settings" : "problems");

  return (
    <div className="flex w-full flex-col flex-1 items-center justify-center gap-4 p-4">
      <Tabs
        className="w-full flex-1 max-w-6xl mx-auto"
        value={tab}
        onValueChange={handleTabChange}
      >
        <div className="flex w-full items-center justify-between gap-4 pb-4 mb-2">
          <div className="overflow-x-auto scrollbar-hide">
            <TabsList className="inline-flex min-w-max h-12 items-center justify-start rounded-none bg-muted/40 p-1 text-muted-foreground border border-muted/50">
              <TabsTrigger
                className="inline-flex items-center justify-center whitespace-nowrap rounded-none px-6 py-2.5 text-sm font-semibold transition-all hover:text-foreground data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm gap-2"
                value="problems"
              >
                {t("Tabs.problems")}
                <ListOrdered className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger
                className="inline-flex items-center justify-center whitespace-nowrap rounded-none px-6 py-2.5 text-sm font-semibold transition-all hover:text-foreground data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400 data-[state=active]:shadow-sm gap-2"
                value="leaderboard"
              >
                {t("Tabs.leaderboard")}
                <Trophy className="w-4 h-4" />
              </TabsTrigger>
              {isOwner && (
                <TabsTrigger
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-none px-6 py-2.5 text-sm font-semibold transition-all hover:text-foreground data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm gap-2"
                  value="settings"
                >
                  {t("Tabs.settings")}
                  <Settings className="w-4 h-4" />
                </TabsTrigger>
              )}
              {isOwner && isPublished && (
                <TabsTrigger
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-none px-6 py-2.5 text-sm font-semibold transition-all hover:text-foreground data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:text-rose-600 dark:data-[state=active]:text-rose-400 data-[state=active]:shadow-sm"
                  value="manage"
                >
                  {t("Tabs.manage")}
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {isOwner && !isPublished && (
            <div className="shrink-0">
              <PublishContest contest={contest} />
            </div>
          )}
        </div>

        <div className="mt-4">
          <TabsContent
            className="flex w-full gap-4 focus-visible:outline-none focus-visible:ring-0"
            value="problems"
          >
            {contest.joinStatus === "pending" ? (
              <Empty className="w-full min-h-[30vh]">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Lock />
                  </EmptyMedia>
                  <EmptyTitle>{t("Tabs.pendingTitle")}</EmptyTitle>
                  <EmptyDescription>
                    {t("Tabs.pendingDescription")}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ProblemTab contest={contest} user={user} />
            )}
          </TabsContent>
          <TabsContent
            className="focus-visible:outline-none focus-visible:ring-0"
            value="leaderboard"
          >
            <Leaderboard contest={contest} />
          </TabsContent>
          {isOwner && (
            <TabsContent
              className="focus-visible:outline-none focus-visible:ring-0"
              value="settings"
            >
              <ContestSettings contestId={contest.id} />
            </TabsContent>
          )}
          {isOwner && isPublished && (
            <TabsContent
              className="focus-visible:outline-none focus-visible:ring-0"
              value="manage"
            >
              <ContestManagement contest={contest} />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
