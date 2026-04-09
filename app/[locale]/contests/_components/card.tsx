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
import type { Contest, UserOnContest } from "@/drizzle/schema";
import { Link } from "@/i18n/navigation";
import { formatDuration } from "@/lib/format-duration";
import { Users, Calendar, Clock, Trophy, ChevronRight } from "lucide-react";

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

  function getStatusInfo(start: Date, end: Date) {
    if (now < start) {
      const diffMs = start.getTime() - now.getTime();
      return {
        text: `${t("card.starts") || "Starts in"}: ${formatDuration(diffMs)}`,
        badge: "Upcoming",
        color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
        gradient: "from-emerald-500 to-teal-400"
      };
    }

    if (start <= now && now <= end) {
      const diffMs = end.getTime() - now.getTime();
      return {
        text: `${t("card.ends") || "Ends in"}: ${formatDuration(diffMs)}`,
        badge: "Active",
        color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-500 border-amber-200 dark:border-amber-500/20",
        gradient: "from-amber-500 to-orange-400"
      };
    }

    return {
      text: t("card.finished") || "Finished",
      badge: "Past",
      color: "text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700",
      gradient: "from-neutral-400 to-neutral-500"
    };
  }

  const status = getStatusInfo(contest.startDate, contest.endDate);

  return (
    <Link href={`/contests/${contest.id}`} className="block group">
      <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl border-muted/60 dark:border-white/5">

        {/* Top gradient sliver */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r ${status.gradient} opacity-90`} />

        <CardHeader className="pb-3 flex flex-row items-start justify-between">
          <div className="space-y-1.5 flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${status.color}`}>
                {status.badge}
              </span>
              <span className="text-xs text-muted-foreground flex items-center font-medium">
                <Clock className="w-3.5 h-3.5 mr-1 opacity-70" />
                {formatDuration(contest.endDate.getTime() - contest.startDate.getTime())} duration
              </span>
            </div>

            <CardTitle className="text-xl font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
              {contest.name}
            </CardTitle>

            <CardDescription className="flex items-center text-sm font-medium pt-1">
              <span className={`flex items-center ${status.badge === 'Past' ? 'text-neutral-500' : 'text-foreground/80'
                }`}>
                {status.text}
              </span>
            </CardDescription>
          </div>

          <div className="hidden sm:flex flex-col items-center justify-center p-3 bg-muted/40 rounded-xl border border-muted/50 mt-1 shrink-0 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors">
            <Trophy className="w-6 h-6 text-indigo-400 mb-1" />
            <span className="text-[11px] font-semibold text-muted-foreground">REWARD</span>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 pt-4 border-t border-muted/50">
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="w-4 h-4 mr-2 text-blue-500/70" />
              <span className="font-medium text-foreground/80 mr-1">{contest.users.length}</span> {t("card.participants") || "participants"}
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-2 text-indigo-500/70" />
              <span className="font-medium">{new Date(contest.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
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
