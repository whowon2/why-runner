import { notFound } from "next/navigation";
import { SURVEY_FORMS, type SurveyFormKey } from "@/drizzle/schemas/surveys";
import { requireUser } from "@/lib/auth/require-user";
import { canPreviewSurveys } from "@/lib/surveys/admin";
import { SurveyPreview } from "../../_components/survey-preview";

export default async function SurveyPreviewPage({
  params,
}: {
  params: Promise<{ form: string }>;
}) {
  const { form } = await params;
  const user = await requireUser({ redirectTo: "/auth/signin" });
  if (!(await canPreviewSurveys(user))) notFound();
  if (!(SURVEY_FORMS as readonly string[]).includes(form)) notFound();

  return (
    <div className="flex w-full flex-1 flex-col items-center gap-4 p-4">
      <SurveyPreview form={form as SurveyFormKey} />
    </div>
  );
}
