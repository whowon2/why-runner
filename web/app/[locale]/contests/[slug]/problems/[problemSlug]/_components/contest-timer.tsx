"use client";

import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const h = String(Math.floor((total % 86400) / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return days > 0 ? `${days}d ${h}:${m}:${s}` : `${h}:${m}:${s}`;
}

/** Re-renders every second; `null` until mounted (server time ≠ client). */
export function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** Time left in the contest, for the workspace top bar. */
export function ContestTimer({ endDate }: { endDate: Date | null }) {
  const t = useTranslations("Workspace.Status");
  const now = useNow();
  if (!now || !endDate) return null;
  const left = endDate.getTime() - now.getTime();
  return (
    <span className="flex items-center gap-1.5 tabular-nums">
      <Clock className="size-4" />
      {left > 0 ? t("timeLeft", { time: formatDuration(left) }) : t("ended")}
    </span>
  );
}
