"use client";

import { CheckCircle2, ClipboardList, Lock } from "lucide-react";
import { useFormatter } from "next-intl";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import type { SurveyFormKey } from "@/drizzle/schemas/surveys";
import { useSurvey } from "@/hooks/use-surveys";
import { Link } from "@/i18n/navigation";
import { SurveyForm } from "./survey-form";
import { useSurveyText } from "./use-survey-text";

export function SurveyPage({
  form,
  entityId,
}: {
  form: SurveyFormKey;
  entityId: string;
}) {
  const t = useSurveyText();
  const format = useFormatter();
  const { data: survey, isPending, refetch } = useSurvey(form, entityId);

  return (
    <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col gap-8 py-8">
      <PageHeader
        icon={ClipboardList}
        title={t(`forms.${form}.title`)}
        subtitle={survey?.entity.name ?? t(`formLabels.${form}`)}
      />

      {isPending && <Skeleton className="h-96 w-full" />}

      {survey?.status === "eligible" && (
        <div className="max-w-3xl">
          <SurveyForm
            form={form}
            entityId={entityId}
            onSubmitted={() => {
              refetch();
              window.scrollTo({ top: 0 });
            }}
          />
        </div>
      )}

      {survey?.status === "answered" && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CheckCircle2 />
            </EmptyMedia>
            <EmptyTitle>{t("page.alreadyTitle")}</EmptyTitle>
            <EmptyDescription>
              {t("page.alreadyText", {
                date: format.dateTime(survey.answeredAt, { dateStyle: "long" }),
              })}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild variant="outline">
              <Link href="/surveys">{t("page.backToHub")}</Link>
            </Button>
          </EmptyContent>
        </Empty>
      )}

      {survey?.status === "not_eligible" && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Lock />
            </EmptyMedia>
            <EmptyTitle>{t("page.notEligibleTitle")}</EmptyTitle>
            <EmptyDescription>
              {t("page.notEligibleText", { who: t(`page.who.${form}`) })}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row flex-wrap justify-center">
            {survey.alternative && (
              <Button asChild>
                <Link href={`/surveys/${survey.alternative}/${entityId}`}>
                  {t("page.tryOther", {
                    label: t(`formLabels.${survey.alternative}`),
                  })}
                </Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href="/surveys">{t("page.backToHub")}</Link>
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </div>
  );
}
