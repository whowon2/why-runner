"use client";

import { BarChart3, ClipboardList, Eye } from "lucide-react";
import { useFormatter } from "next-intl";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SURVEY_FORMS } from "@/drizzle/schemas/surveys";
import { useMySurveys } from "@/hooks/use-surveys";
import { Link } from "@/i18n/navigation";
import { useSurveyText } from "./use-survey-text";

export function SurveyHub() {
  const t = useSurveyText();
  const format = useFormatter();
  const { data, isPending } = useMySurveys();

  return (
    <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col gap-8 py-8">
      <PageHeader
        icon={ClipboardList}
        title={t("hub.title")}
        subtitle={t("hub.subtitle")}
        action={
          data?.isAdmin && (
            <Button asChild variant="outline">
              <Link href="/surveys/results">
                <BarChart3 />
                {t("hub.results")}
              </Link>
            </Button>
          )
        }
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("hub.pending")}
        </h2>
        {isPending && <Skeleton className="h-20 w-full" />}
        {data && data.pending.length === 0 && (
          <p className="border border-dashed p-6 text-sm text-muted-foreground">
            {t("hub.emptyPending")}
          </p>
        )}
        <ul className="flex flex-col gap-2">
          {data?.pending.map(({ form, entity }) => (
            <li
              key={`${form}:${entity.id}`}
              className="flex flex-col gap-3 border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <Badge variant="outline">{t(`formLabels.${form}`)}</Badge>
                <p className="truncate font-medium">{entity.name}</p>
              </div>
              <Button asChild className="shrink-0">
                <Link href={`/surveys/${form}/${entity.id}`}>
                  {t("hub.answer")}
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </section>

      {data?.canPreview && (
        <section className="flex flex-col gap-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("preview.section")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("preview.sectionHint")}
            </p>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {SURVEY_FORMS.map((form) => (
              <li
                key={form}
                className="flex items-center justify-between gap-3 border border-dashed p-4"
              >
                <span className="min-w-0 truncate font-medium">
                  {t(`formLabels.${form}`)}
                </span>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/surveys/preview/${form}`}>
                    <Eye />
                    {t("preview.open")}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("hub.answered")}
        </h2>
        {data && data.answered.length === 0 && (
          <p className="border border-dashed p-6 text-sm text-muted-foreground">
            {t("hub.emptyAnswered")}
          </p>
        )}
        <ul className="flex flex-col gap-2">
          {data?.answered.map((a) => (
            <li
              key={`${a.form}:${a.entityId}:${a.answeredAt.toISOString()}`}
              className="flex flex-col gap-1 border p-4 text-muted-foreground"
            >
              <Badge variant="secondary">{t(`formLabels.${a.form}`)}</Badge>
              <p className="truncate font-medium text-foreground">
                {a.entityName}
              </p>
              <p className="text-xs">
                {t("hub.answeredOn", {
                  date: format.dateTime(a.answeredAt, { dateStyle: "medium" }),
                })}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
