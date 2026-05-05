"use client";

import {
  Calendar,
  ChevronRight,
  Clock,
  ListOrdered,
  Lock,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Contest, UserOnContest } from "@/drizzle/schema";
import { Link } from "@/i18n/navigation";
import { formatDuration } from "@/lib/format-duration";
import { getContestStatus } from "@/lib/get-contest-status";

export function ContestCard({
  contest,
}: {
  contest: Contest & { users: UserOnContest[]; problems: unknown[] };
}) {
  const [now, setNow] = useState(new Date());
  const t = useTranslations("ContestsPage");

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function getStatusText(start: Date, end: Date) {
    if (now < new Date(start)) {
      return `${t("card.starts")}: ${formatDuration(new Date(start).getTime() - now.getTime())}`;
    }
    if (new Date(start) <= now && now <= new Date(end)) {
      return `${t("card.ends")}: ${formatDuration(new Date(end).getTime() - now.getTime())}`;
    }
    return t("card.finished");
  }

  const status = getContestStatus(contest.startDate, contest.endDate, now);
  const statusText = getStatusText(contest.startDate, contest.endDate);

  return (
    <Link href={`/contests/${contest.id}`} className="block group">
      <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl border-muted/60 dark:border-white/5">
        {/* Top gradient sliver */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r ${status.gradient} opacity-90`}
        />

        <CardHeader className="pb-3 flex flex-row items-start justify-between">
          <div className="space-y-1.5 flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${status.color}`}
              >
                {status.badge}
              </span>
              {contest.isPrivate && (
                <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border border-muted text-muted-foreground bg-muted/40">
                  <Lock className="w-3 h-3" />
                  {t("card.private")}
                </span>
              )}
              <span className="text-xs text-muted-foreground flex items-center font-medium">
                <Clock className="w-3.5 h-3.5 mr-1 opacity-70" />
                {formatDuration(
                  new Date(contest.endDate).getTime() -
                    new Date(contest.startDate).getTime(),
                )}{" "}
                {t("card.duration")}
              </span>
            </div>

            <CardTitle className="text-xl font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
              {contest.name}
            </CardTitle>

            <CardDescription className="flex items-center text-sm font-medium pt-1">
              <span
                className={`flex items-center ${
                  status.badge === "Past"
                    ? "text-neutral-500"
                    : "text-foreground/80"
                }`}
              >
                {statusText}
              </span>
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 pt-4 border-t border-muted/50">
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="w-4 h-4 mr-2 text-blue-500/70" />
              <span className="font-medium text-foreground/80 mr-1">
                {contest.users.length}
              </span>{" "}
              {t("card.participants")}
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <ListOrdered className="w-4 h-4 mr-2 text-indigo-500/70" />
              <span className="font-medium text-foreground/80 mr-1">
                {contest.problems.length}
              </span>{" "}
              {t("card.problems")}
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-2 text-indigo-500/70" />
              <span className="font-medium">
                {new Date(contest.startDate).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="ml-auto w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors text-muted-foreground">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
