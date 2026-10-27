"use client";

import { ArrowLeft, ScanSearch } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/page-header";
import {
  SimilarityReport,
  usePickParam,
} from "@/components/similarity/similarity-report";
import { Button } from "@/components/ui/button";
import { useExerciseSimilarity } from "@/hooks/use-exercise-similarity";
import { Link } from "@/i18n/navigation";

export function ExerciseSimilarity({
  exerciseId,
  problemTitle,
  lessonTitle,
  lessonHref,
}: {
  exerciseId: string;
  problemTitle: string;
  lessonTitle: string;
  lessonHref: string;
}) {
  const t = useTranslations("Similarity");
  const [pick] = usePickParam();
  const { data, isPending, error } = useExerciseSimilarity(exerciseId, pick);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 py-8">
      <Button asChild className="w-fit px-0" variant="link">
        <Link href={lessonHref}>
          <ArrowLeft />
          {t("backToLesson")}
        </Link>
      </Button>
      <PageHeader
        icon={ScanSearch}
        subtitle={t("exerciseSubtitle", {
          problem: problemTitle,
          lesson: lessonTitle,
        })}
        title={t("title")}
      />
      <SimilarityReport data={data} error={error} isPending={isPending} />
    </div>
  );
}
