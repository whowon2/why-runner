"use client";

import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useExercise } from "@/hooks/use-exercise";
import { useNextExercise } from "@/hooks/use-next-exercise";
import { usePreviousExercise } from "@/hooks/use-previous-exercise";

export function ExerciseHeader({ exerciseId }: { exerciseId: string }) {
  const t = useTranslations("RoadmapPage");
  const { data: exercise, isPending } = useExercise(exerciseId);
  const { data: nextExercise } = useNextExercise(exerciseId);
  const { data: previousExercise } = usePreviousExercise(exerciseId);

  return (
    <div className="flex flex-col gap-3">
      <Button asChild className="w-fit px-0" variant="link">
        <Link
          href={
            exercise
              ? `/classes/${exercise.lesson.classroom.slug}/lessons/${exercise.lesson.slug}`
              : "/classes"
          }
        >
          <ArrowLeft />
          {t("backToRoadmap")}
        </Link>
      </Button>

      {isPending ? (
        <Skeleton className="h-9 w-64" />
      ) : exercise ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-bold text-2xl">{exercise.problem.title}</h1>
            {exercise.done && (
              <Badge className="bg-green-500">
                <CheckCircle2 className="size-3" />
                {t("completed")}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {previousExercise && (
              <Button asChild variant="outline">
                <Link
                  href={`/classes/${exercise.lesson.classroom.slug}/lessons/${exercise.lesson.slug}/exercises/${previousExercise.slug}`}
                >
                  <ArrowLeft />
                  {t("previousLesson")}
                </Link>
              </Button>
            )}
            {nextExercise && (
              <Button asChild variant="outline">
                <Link
                  href={`/classes/${exercise.lesson.classroom.slug}/lessons/${exercise.lesson.slug}/exercises/${nextExercise.slug}`}
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
