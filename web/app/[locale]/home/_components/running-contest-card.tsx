import { Radio } from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import type { HomeData } from "@/lib/actions/home/get-home-data";
import { Widget, WidgetRow } from "./widget";

export function RunningContestCard({
  contests,
}: {
  contests: HomeData["runningContests"];
}) {
  const t = useTranslations("Home.running");
  const format = useFormatter();
  // Re-render every 30s so "ends in …" keeps counting down.
  const now = useNow({ updateInterval: 30_000 });

  return (
    <Widget icon={Radio} title={t("title")}>
      {contests.map((c) => (
        <WidgetRow key={c.id} href={`/contests/${c.slug}`}>
          <span className="truncate font-medium">{c.name}</span>
          {c.endDate && (
            <span className="shrink-0 text-primary text-xs">
              {t("endsIn", { time: format.relativeTime(c.endDate, now) })}
            </span>
          )}
        </WidgetRow>
      ))}
    </Widget>
  );
}
