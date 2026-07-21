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
    <div className="relative flex flex-col items-center justify-center gap-6 mt-6 mb-8 w-full max-w-6xl p-8 rounded-3xl bg-white/40 dark:bg-neutral-900/40 backdrop-blur-xl border border-white/20 shadow-2xl shadow-indigo-500/5">
      {/* Top gradient sliver */}
      <div
        className={`absolute top-0 left-0 right-0 h-2 bg-linear-to-r ${status.gradient} opacity-90 rounded-t-3xl`}
      />

      {/* Status badges */}
      <div className="flex items-center gap-3 flex-wrap justify-center mt-2">
        <span
          className={`text-xs uppercase font-bold tracking-widest px-3 py-1 rounded-full border ${status.color}`}
        >
          {status.badge}
        </span>
        {c.isPrivate && (
          <span className="flex items-center gap-1.5 text-xs uppercase font-bold tracking-widest px-3 py-1 rounded-full border border-muted text-muted-foreground bg-muted/40">
            <Lock className="w-3.5 h-3.5" />
            {t("Tabs.Description.private")}
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className="font-extrabold text-4xl sm:text-5xl text-center tracking-tight text-foreground bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/70">
        {c.name}
      </h1>

      {/* Description */}
      {c.description && (
        <p className="text-base sm:text-lg text-muted-foreground text-center max-w-2xl leading-relaxed">
          {c.description}
        </p>
      )}

      {/* Join / Leave button */}
      <div className="mt-2">
        <JoinButton contest={c} isCreatedByUser={isCreatedByUser} user={user} />
      </div>

      {/* Stats & Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-4">
        {/* Countdown */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/30 border border-muted/50 gap-2 transition-transform hover:scale-[1.02]">
          <div className="p-2 rounded-full bg-indigo-500/10 text-indigo-500">
            <CalendarDays className="w-5 h-5" />
          </div>
          <span className="text-sm font-semibold text-center">{getCountdown()}</span>
        </div>

        {/* Date range */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/30 border border-muted/50 gap-2 transition-transform hover:scale-[1.02]">
          <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="flex flex-col items-center text-xs font-medium text-muted-foreground text-center">
            <span>{formatDate(startDate)}</span>
            <span className="my-0.5 opacity-50">↓</span>
            <span>{formatDate(endDate)}</span>
          </div>
        </div>

        {/* Participants stat card */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/30 border border-muted/50 gap-1 transition-transform hover:scale-[1.02]">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="text-2xl font-bold">{c.users.length}</span>
          </div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            {t("Tabs.Description.participants")}
          </span>
        </div>

        {/* Problems stat card */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/30 border border-muted/50 gap-1 transition-transform hover:scale-[1.02]">
          <div className="flex items-center gap-2 mb-1">
            <ListOrdered className="w-5 h-5 text-purple-500" />
            <span className="text-2xl font-bold">{c.problems.length}</span>
          </div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            {t("Tabs.Description.problems")}
          </span>
        </div>
      </div>
    </div>
  );
}
