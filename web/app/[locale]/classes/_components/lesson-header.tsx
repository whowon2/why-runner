"use client";

import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLesson } from "@/hooks/use-lesson";
import { useNextLesson } from "@/hooks/use-next-lesson";
import { usePreviousLesson } from "@/hooks/use-previous-lesson";

export function LessonHeader({ lessonId }: { lessonId: string }) {
  const t = useTranslations("RoadmapPage");
  const { data: lesson, isPending } = useLesson(lessonId);
  const { data: nextLesson } = useNextLesson(lessonId);
  const { data: previousLesson } = usePreviousLesson(lessonId);

  return (
    <div className="flex flex-col gap-3">
      <Button asChild className="w-fit px-0" variant="link">
        <Link
          href={
            lesson
              ? `/classes/${lesson.track.classroom.slug}/tracks/${lesson.track.slug}`
              : "/classes"
          }
        >
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
            {lesson.done && (
              <Badge className="bg-green-500">
                <CheckCircle2 className="size-3" />
                {t("completed")}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {previousLesson && (
              <Button asChild variant="outline">
                <Link
                  href={`/classes/${lesson.track.classroom.slug}/lessons/${previousLesson.slug}`}
                >
                  <ArrowLeft />
                  {t("previousLesson")}
                </Link>
              </Button>
            )}
            {nextLesson && (
              <Button asChild variant="outline">
                <Link
                  href={`/classes/${lesson.track.classroom.slug}/lessons/${nextLesson.slug}`}
                >
                  {t("nextLesson")}
                  <ArrowRight />
                </Link>
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
