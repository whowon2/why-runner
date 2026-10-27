import { CircleCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { DifficultyBadge } from "@/app/[locale]/problems/_components/badge";
import type { HomeData } from "@/lib/actions/home/get-home-data";
import { Widget, WidgetEmpty, WidgetRow } from "./widget";

export function RecentSolvesCard({
  problems,
}: {
  problems: HomeData["recentSolves"];
}) {
  const t = useTranslations("Home.solves");

  return (
    <Widget icon={CircleCheck} title={t("title")}>
      {problems.length === 0 ? (
        <WidgetEmpty message={t("empty")} href="/problems" cta={t("cta")} />
      ) : (
        problems.map((p) => <ProblemRow key={p.id} problem={p} />)
      )}
    </Widget>
  );
}

export function ProblemRow({
  problem,
}: {
  problem:
    | HomeData["recentSolves"][number]
    | HomeData["suggestedProblems"][number];
}) {
  return (
    <WidgetRow href={`/problems/${problem.slug}`}>
      <span className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 font-mono text-muted-foreground text-xs">
          {problem.code}
        </span>
        <span className="truncate font-medium">{problem.title}</span>
      </span>
      <DifficultyBadge difficulty={problem.difficulty} />
    </WidgetRow>
  );
}
