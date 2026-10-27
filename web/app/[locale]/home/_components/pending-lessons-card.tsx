import { ClipboardList } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { HomeData } from "@/lib/actions/home/get-home-data";
import { Widget, WidgetEmpty, WidgetRow } from "./widget";

export function PendingLessonsCard({
  lessons,
}: {
  lessons: HomeData["pendingLessons"];
}) {
  const t = useTranslations("Home.pending");
  const format = useFormatter();

  return (
    <Widget icon={ClipboardList} title={t("title")}>
      {lessons.length === 0 ? (
        <WidgetEmpty message={t("empty")} href="/classes" cta={t("cta")} />
      ) : (
        lessons.map((l) => (
          <WidgetRow
            key={l.id}
            href={`/classes/${l.classSlug}/lessons/${l.slug}`}
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate font-medium">{l.title}</span>
              <span className="truncate text-muted-foreground text-xs">
                {l.className}
              </span>
              <span className="text-muted-foreground text-xs">
                {l.dueDate
                  ? t("due", {
                      date: format.dateTime(l.dueDate, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }),
                    })
                  : t("noDue")}
              </span>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {l.isOverdue && (
                <Badge variant="destructive">{t("overdue")}</Badge>
              )}
              <span className="text-muted-foreground text-xs tabular-nums">
                {t("progress", {
                  passed: l.passedCount,
                  total: l.exerciseCount,
                })}
              </span>
            </div>
          </WidgetRow>
        ))
      )}
    </Widget>
  );
}
