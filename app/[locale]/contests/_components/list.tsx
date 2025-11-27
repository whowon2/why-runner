"use client";

import { useTranslations } from "next-intl";
import type { Contest } from "@/lib/db/schema";
import { ContestCard } from "./card";
import { CreateContestDialog } from "./dialog";

export function ContestList({ contests }: { contests: Contest[] }) {
  const t = useTranslations("ContestsPage");

  return (
    <div className="w-full max-w-7xl flex-1">
      <div className="flex justify-between">
        <h1 className="font-bold text-2xl">{t("title")}</h1>
        <CreateContestDialog />
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
