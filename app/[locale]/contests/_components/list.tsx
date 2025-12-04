"use client";

import type { User } from "better-auth";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useContests } from "@/hooks/use-contests";
import { Link } from "@/i18n/navigation";
import { ContestCard } from "./card";
import { CreateContestDialog } from "./create/dialog";
import { Loader } from "lucide-react";

export function ContestList({ user }: { user: User }) {
  const t = useTranslations("ContestsPage");

  const { data: contests, isPending } = useContests();

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

      {isPending ? (
        <Loader className="animate-spin w-full mt-8" />
      ) : (
        <div className="flex flex-col gap-4 py-4">
          {contests.map((contest) => (
            <ContestCard contest={contest} key={contest.id} />
          ))}
        </div>
      )}
    </div>
  );
}
