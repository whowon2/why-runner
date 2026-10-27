import { Sparkles } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { HomeData } from "@/lib/actions/home/get-home-data";
import { ProblemRow } from "./recent-solves-card";
import { Widget, WidgetEmpty, WidgetRow } from "./widget";

export function SuggestionsCard({
  problems,
  contests,
}: {
  problems: HomeData["suggestedProblems"];
  contests: HomeData["suggestedContests"];
}) {
  const t = useTranslations("Home");
  const format = useFormatter();

  return (
    <Widget icon={Sparkles} title={t("suggestions.title")}>
      {problems.length === 0 && contests.length === 0 ? (
        <WidgetEmpty
          message={t("suggestions.empty")}
          href="/problems"
          cta={t("suggestions.cta")}
        />
      ) : (
        <>
          {problems.length > 0 && (
            <h3 className="font-medium text-muted-foreground text-xs uppercase">
              {t("suggestions.problems")}
            </h3>
          )}
          {problems.map((p) => (
            <ProblemRow key={p.id} problem={p} />
          ))}
          {contests.length > 0 && (
            <h3 className="mt-2 font-medium text-muted-foreground text-xs uppercase">
              {t("suggestions.contests")}
            </h3>
          )}
          {contests.map((c) => (
            <WidgetRow key={c.id} href={`/contests/${c.slug}`}>
              <span className="truncate font-medium">{c.name}</span>
              <span className="shrink-0 text-muted-foreground text-xs">
                {c.status === "upcoming" && c.startDate
                  ? format.dateTime(c.startDate, { dateStyle: "medium" })
                  : t(`contestStatus.${c.status}`)}
              </span>
            </WidgetRow>
          ))}
        </>
      )}
    </Widget>
  );
}
