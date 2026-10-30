import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { SURVEY_FORMS } from "@/drizzle/schemas/surveys";
import { redirect } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { canPreviewSurveys } from "@/lib/surveys/admin";

/** `/surveys/preview` opens the first form's preview. */
export default async function SurveyPreviewIndexPage() {
  const user = await requireUser({ redirectTo: "/auth/signin" });
  if (!(await canPreviewSurveys(user))) notFound();

  redirect({
    href: `/surveys/preview/${SURVEY_FORMS[0]}`,
    locale: await getLocale(),
  });
}
