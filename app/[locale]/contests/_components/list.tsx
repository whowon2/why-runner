"use client";

import type { User } from "better-auth";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useContests } from "@/hooks/use-contests";
import { Link } from "@/i18n/navigation";
import { ContestCard } from "./card";
import { CreateContestDialog } from "./create/dialog";

export function ContestList({ user }: { user: User }) {
  const t = useTranslations("ContestsPage");

  const { data: contests, isPending, refetch: refetchContests } = useContests();

  if (isPending) {
    return (
      <div className="w-full max-w-7xl flex-1">
        <div className="flex justify-between">
          <h1 className="font-bold text-2xl">{t("title")}</h1>
          <CreateContestDialog refetchAction={refetchContests} user={user} />
        </div>

        <div className="flex flex-col gap-4 py-4 w-full">
          {[1, 2, 3, 4, 5].map((_, index) => (
            <Skeleton className="h-24 w-full" key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (!contests) {
    return <div>error</div>;
  }

  return (
    <div className="w-full max-w-7xl flex-1">
      <div className="flex justify-between">
        <h1 className="font-bold text-2xl">{t("title")}</h1>
        <Button asChild>
          <Link href={"/user?tab=contests"}>My Contests</Link>
        </Button>
      </div>

      {contests && contests.length === 0 && (
        <div className="flex h-32 items-center justify-center">
          <p className="text-gray-500">{t("notFound")}</p>
        </div>
      )}

      <div className="flex flex-col gap-4 py-4">
        {contests.map((contest) => (
          <ContestCard contest={contest} key={contest.id} />
        ))}
      </div>
    </div>
  );
}
