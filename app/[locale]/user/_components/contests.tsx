"use client";

import type { User } from "better-auth";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useContests } from "@/hooks/use-contests";
import { Link } from "@/i18n/navigation";
import type { Contest, UserOnContest } from "@/lib/db/schema";
import { formatDuration } from "@/lib/format-duration";
import { cn } from "@/lib/utils";
import { CreateContestDialog } from "../../contests/_components/create/dialog";

export function ContestsList({ user }: { user: User }) {
  const t = useTranslations("ContestsPage");

  const { data: contests, isPending, refetch: refetchContests } = useContests();

  if (isPending) {
    return <div>loading</div>;
  }

  if (!contests) {
    return <div>error</div>;
  }

  const myContests = contests.filter(
    (contest) => contest.createdBy === user.id,
  );

  return (
    <div className="w-full flex-1">
      <div className="flex justify-between">
        <h1 className="font-bold text-2xl">{t("title")}</h1>
        <CreateContestDialog refetchAction={refetchContests} user={user} />
      </div>

      {myContests && myContests.length === 0 && (
        <div className="flex h-32 items-center justify-center">
          <p className="text-gray-500">{t("notFound")}</p>
        </div>
      )}

      <div className="flex flex-col gap-4 py-4">
        {myContests.map((contest) => (
          <ContestCard contest={contest} key={contest.id} />
        ))}
      </div>
    </div>
  );
}

export function ContestCard({
  contest,
}: {
  contest: Contest & { users: UserOnContest[] };
}) {
  const [now, setNow] = useState(new Date());
  const t = useTranslations("ContestsPage");

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function getStatus(start: Date, end: Date) {
    if (now < start) {
      const diffMs = start.getTime() - now.getTime();
      return `${t("card.starts")}: ${formatDuration(diffMs)}`;
    }

    if (start <= now && now <= end) {
      const diffMs = end.getTime() - now.getTime();
      return `${t("card.ends")}: ${formatDuration(diffMs)}`;
    }

    return t("card.finished");
  }

  return (
    <Card className="flex justify-between rounded-lg border" key={contest.id}>
      <CardHeader>
        <Link href={`/contests/${contest.id}`}>
          <CardTitle>{contest.name}</CardTitle>
        </Link>
        <CardDescription>
          <p
            className={cn("text-secondary text-sm", {
              "text-green-500": now < contest.startDate,
              "text-red-500":
                contest.startDate <= now && now <= contest.endDate,
            })}
          >
            {getStatus(contest.startDate, contest.endDate)}
          </p>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          {t("card.participants")}: {contest.users.length}
        </p>
      </CardContent>
    </Card>
  );
}
