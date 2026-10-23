import { notFound } from "next/navigation";
import { getSurvey } from "@/lib/actions/surveys/get-survey";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { SurveyPage } from "../../_components/survey-page";
import type { SurveyFormKey } from "@/drizzle/schemas/surveys";

export default async function Page({
  params,
}: {
  params: Promise<{ form: string; entityId: string }>;
}) {
  const { form, entityId } = await params;
  await requireOnboardedUser({ redirectTo: "/auth/signin" });

  // Unknown form or entity id: 404 rather than an empty questionnaire.
  if (!(await getSurvey({ form, entityId }))) notFound();

  return (
    <div className="flex w-full flex-1 flex-col items-center gap-4 p-4">
      <SurveyPage form={form as SurveyFormKey} entityId={entityId} />
    </div>
  );
}
