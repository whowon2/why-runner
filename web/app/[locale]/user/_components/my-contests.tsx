"use client";

import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useContests } from "@/hooks/use-contests";
import { ContestCard } from "../../contests/_components/card";
import { CreateContestButton } from "../../contests/_components/create/button";

const ITEMS_PER_PAGE = 5;

export function MyContests({
  userId,
  isOwner,
}: {
  userId: string;
  isOwner: boolean;
}) {
  const t = useTranslations("UserPage.MyContests");
  const tContests = useTranslations("ContestsPage");
  const [page, setPage] = useState(1);
  const { data, isPending, isPlaceholderData } = useContests({
    page,
    pageSize: ITEMS_PER_PAGE,
    my: true,
    userId,
  });

  const contests = data?.data || [];
  const totalCount = data?.total || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-4 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {isOwner && (
        <div className="flex justify-end">
          <CreateContestButton />
        </div>
      )}

      {isPending ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-40 w-full rounded-none bg-muted/40"
            />
          ))}
        </div>
      ) : contests.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Trophy />
            </EmptyMedia>
            <EmptyTitle>
              {isOwner ? t("emptyTitleOwner") : t("emptyTitleVisitor")}
            </EmptyTitle>
            <EmptyDescription>
              {isOwner
                ? t("emptyDescriptionOwner")
                : t("emptyDescriptionVisitor")}
            </EmptyDescription>
          </EmptyHeader>
          {isOwner && <CreateContestButton />}
        </Empty>
      ) : (
        <div
          className={`flex flex-col gap-4 transition-opacity duration-300 ${
            isPlaceholderData ? "opacity-60 saturate-50" : ""
          }`}
        >
          {contests.map((contest) => (
            <ContestCard key={contest.id} contest={contest} />
          ))}
        </div>
      )}

      {!isPending && totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between py-6 border-t gap-4">
          <div className="text-sm font-medium text-muted-foreground bg-muted/30 px-4 py-2 rounded-none">
            {tContests("pagination.showing", {
              from: (page - 1) * ITEMS_PER_PAGE + 1,
              to: Math.min(page * ITEMS_PER_PAGE, totalCount),
              total: totalCount,
            })}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="rounded-none h-10 w-10"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-sm font-semibold min-w-24 text-center">
              {tContests("pagination.page", { page, totalPages })}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-none h-10 w-10"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
