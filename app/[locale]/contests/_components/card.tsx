"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { Contest, UserOnContest } from "@/lib/db/schema";
import { formatDuration } from "@/lib/format-duration";
import { cn } from "@/lib/utils";

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
