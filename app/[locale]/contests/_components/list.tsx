"use client";

import { useTranslations } from "next-intl";
import { useContests } from "@/hooks/use-contests";
import { ContestCard } from "./card";
import { CreateContestDialog } from "./create/dialog";

export function ContestList() {
  const t = useTranslations("ContestsPage");

  const { data: contests, isPending, refetch: refetchContests } = useContests();

  if (isPending) {
    return <div>loading</div>;
  }

  if (!contests) {
    return <div>error</div>;
  }

  return (
    <div className="w-full max-w-7xl flex-1">
      <div className="flex justify-between">
        <h1 className="font-bold text-2xl">{t("title")}</h1>
        <CreateContestDialog refetchAction={refetchContests} />
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
