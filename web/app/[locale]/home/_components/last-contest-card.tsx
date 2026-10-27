import { Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { HomeData } from "@/lib/actions/home/get-home-data";
import { Widget, WidgetEmpty, WidgetRow } from "./widget";

export function LastContestCard({
  contest,
}: {
  contest: HomeData["lastJoinedContest"];
}) {
  const t = useTranslations("Home");

  return (
    <Widget icon={Trophy} title={t("lastContest.title")}>
      {contest ? (
        <WidgetRow href={`/contests/${contest.slug}`}>
          <span className="truncate font-medium">{contest.name}</span>
          <Badge variant="outline">
            {t(`contestStatus.${contest.status}`)}
          </Badge>
        </WidgetRow>
      ) : (
        <WidgetEmpty
          message={t("lastContest.empty")}
          href="/contests"
          cta={t("lastContest.cta")}
        />
      )}
    </Widget>
  );
}
