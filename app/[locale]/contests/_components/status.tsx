"use client";

import { CalendarDays } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { Contest } from "@/lib/db/schema";
import { formatDuration } from "@/lib/format-duration";

export function ContestStatus({ contest }: { contest: Contest }) {
  const [now, setNow] = useState(new Date());
  const t = useTranslations("ContestsPage");

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));

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

  const hoursDiff = (start: Date, end: Date) => {
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    return hours;
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {hoursDiff(new Date(), contest.startDate) < 24 ? (
        <div className="flex items-center gap-3">
          <CalendarDays className="w-4 h-4 text-primary" />
          <span>{getStatus(contest.startDate, contest.endDate)}</span>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <CalendarDays className="w-4 h-4 text-primary" />
          <span className="font-medium">{t("Tabs.Description.starts")}:</span>
          <span>{formatDate(contest.startDate)}</span>
        </div>
      )}
    </div>
  );
}
