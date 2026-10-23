import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { SURVEY_FORMS } from "@/drizzle/schemas/surveys";
import { redirect } from "@/i18n/navigation";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { canPreviewSurveys } from "@/lib/surveys/admin";

/** `/surveys/preview` opens the first form's preview. */
export default async function SurveyPreviewIndexPage() {
  const user = await requireOnboardedUser({ redirectTo: "/auth/signin" });
  if (!canPreviewSurveys(user)) notFound();

  redirect({
    href: `/surveys/preview/${SURVEY_FORMS[0]}`,
    locale: await getLocale(),
  });
}
