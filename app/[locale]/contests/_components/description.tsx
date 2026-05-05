"use client";

import { Calendar, CalendarDays, ListOrdered, Lock, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useContest } from "@/hooks/use-contest";
import { authClient } from "@/lib/auth/client";
import { formatDuration } from "@/lib/format-duration";
import { getContestStatus } from "@/lib/get-contest-status";
import { JoinButton } from "./join-and-leave";

export function ContestDescription({ contestId }: { contestId: string }) {
  const t = useTranslations("ContestsPage");
  const { data: contest } = useContest(contestId);
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!user || !contest) return null;

  const c = contest;
  const isCreatedByUser = c.createdBy === user.id;
  const status = getContestStatus(c.startDate, c.endDate, now);
  const startDate = new Date(c.startDate);
  const endDate = new Date(c.endDate);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);

  function getCountdown() {
    if (now < startDate) {
      return `${t("card.starts")}: ${formatDuration(startDate.getTime() - now.getTime())}`;
    }
    if (now <= endDate) {
      return `${t("card.ends")}: ${formatDuration(endDate.getTime() - now.getTime())}`;
    }
    return t("card.finished");
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 mt-8 w-full max-w-2xl">
      {/* Status badges */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <span
          className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${status.color}`}
        >
          {status.badge}
        </span>
        {c.isPrivate && (
          <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border border-muted text-muted-foreground bg-muted/40">
            <Lock className="w-3 h-3" />
            {t("Tabs.Description.private")}
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className="font-bold text-3xl text-center">{c.name}</h1>

      {/* Description */}
      {c.description && (
        <p className="text-sm text-muted-foreground text-center max-w-lg">
          {c.description}
        </p>
      )}

      {/* Join / Leave button */}
      <JoinButton contest={c} isCreatedByUser={isCreatedByUser} user={user} />

      {/* Countdown */}
      <div className="flex items-center gap-2 text-sm">
        <CalendarDays className="w-4 h-4 text-primary" />
        <span>{getCountdown()}</span>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Calendar className="w-3.5 h-3.5" />
        <span>{formatDate(startDate)}</span>
        <span>→</span>
        <span>{formatDate(endDate)}</span>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6 mt-1 px-6 py-3 rounded-xl bg-muted/40 border border-muted/50">
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-blue-500/70" />
          <span className="font-semibold">{c.users.length}</span>
          <span className="text-muted-foreground">
            {t("Tabs.Description.participants")}
          </span>
        </div>
        <div className="w-px h-4 bg-muted" />
        <div className="flex items-center gap-2 text-sm">
          <ListOrdered className="w-4 h-4 text-indigo-500/70" />
          <span className="font-semibold">{c.problems.length}</span>
          <span className="text-muted-foreground">
            {t("Tabs.Description.problems")}
          </span>
        </div>
      </div>
    </div>
  );
}
