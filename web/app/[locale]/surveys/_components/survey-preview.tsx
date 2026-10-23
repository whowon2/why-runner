"use client";

import { Eye } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { SURVEY_FORMS, type SurveyFormKey } from "@/drizzle/schemas/surveys";
import { Link } from "@/i18n/navigation";
import { SurveyForm } from "./survey-form";
import { useSurveyText } from "./use-survey-text";

/** Read-only preview of one form: same questionnaire, nothing is saved. */
export function SurveyPreview({ form }: { form: SurveyFormKey }) {
  const t = useSurveyText();

  return (
    <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col gap-8 py-8">
      <PageHeader
        icon={Eye}
        title={t(`forms.${form}.title`)}
        subtitle={`${t("preview.subtitle")} · ${t(`formLabels.${form}`)}`}
      />

      <nav className="flex flex-wrap gap-2">
        {SURVEY_FORMS.map((f) => (
          <Button
            key={f}
            asChild
            size="sm"
            variant={f === form ? "default" : "outline"}
          >
            <Link
              href={`/surveys/preview/${f}`}
              aria-current={f === form ? "page" : undefined}
            >
              {t(`formLabels.${f}`)}
            </Link>
          </Button>
        ))}
      </nav>

      <p className="border border-dashed border-primary/50 bg-primary/5 p-4 text-sm">
        {t("preview.banner")}
      </p>

      <div className="max-w-3xl">
        {/* key: a fresh form per tab, so answers don't leak between forms */}
        <SurveyForm key={form} form={form} entityId={null} />
      </div>
    </div>
  );
}
