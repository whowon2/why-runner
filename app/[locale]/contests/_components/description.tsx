"use client";

import { ListOrdered, Pencil, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useContest } from "@/hooks/use-contest";
import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";
import { JoinButton } from "./join-and-leave";
import { ContestStatus } from "./status";

export function ContestDescription({ contestId }: { contestId: number }) {
  const t = useTranslations("ContestsPage");
  const { data: contest } = useContest(contestId);
  const { data: session } = authClient.useSession();
  const user = session?.user;

  if (!user) return null;

  if (!contest) {
    return null;
  }

  const isCreatedByUser = contest.createdBy === user.id;

  return (
    <div className="flex flex-col items-center justify-center gap-2 mt-8">
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
          user={user}
        />
      </div>

      <ContestStatus contest={contest} />

      <div className="flex items-center gap-3">
        <Users className="w-4 h-4 text-primary" />
        <span className="font-medium">
          {t("Tabs.Description.participants")}:
        </span>
        <span>{contest.users.length}</span>
      </div>

      <div className="flex items-center gap-3">
        <ListOrdered className="w-4 h-4 text-primary" />
        <span className="font-medium">{t("Tabs.Description.problems")}:</span>
        <span>{contest.problems.length}</span>
      </div>
    </div>
  );
}
