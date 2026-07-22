"use client";

import { ArrowLeft, ArrowRight, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLesson } from "@/hooks/use-lesson";
import { useNextLesson } from "@/hooks/use-next-lesson";

export function LessonHeader({ lessonId }: { lessonId: string }) {
  const t = useTranslations("RoadmapPage");
  const { data: lesson, isPending } = useLesson(lessonId);
  const { data: nextLesson } = useNextLesson(lessonId);

  return (
    <div className="flex flex-col gap-3">
      <Button asChild className="w-fit px-0" variant="link">
        <Link href="/roadmap">
          <ArrowLeft />
          {t("backToRoadmap")}
        </Link>
      </Button>

      {isPending ? (
        <Skeleton className="h-9 w-64" />
      ) : lesson ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-bold text-2xl">{lesson.problem.title}</h1>
            {lesson.completed && (
              <Badge className="bg-green-500">{t("completed")}</Badge>
            )}
            {lesson.locked && (
              <Badge variant="outline">
                <Lock className="size-3" />
                {t("locked")}
              </Badge>
            )}
            {lesson.themes.map((th) => (
              <Badge key={th.theme} variant="secondary">
                {t(`themes.${th.theme}` as Parameters<typeof t>[0])}
              </Badge>
            ))}
          </div>

          {nextLesson && (
            <Button asChild variant="outline">
              <Link href={`/roadmap/${nextLesson.id}`}>
                {t("nextLesson")}
                <ArrowRight />
              </Link>
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
