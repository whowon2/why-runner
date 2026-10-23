import "server-only";

import { env } from "@/env";

function emailIn(list: string | undefined, email: string): boolean {
  const allowed = (list ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}

/**
 * Whether this user may see evaluation survey results. Gated by the
 * comma-separated `SURVEY_ADMIN_EMAILS`; unset or empty means nobody.
 */
export function isSurveyAdmin(user: { email: string }): boolean {
  return emailIn(env.SURVEY_ADMIN_EMAILS, user.email);
}

/**
 * Whether this user may open the read-only previews of every form
 * (`/surveys/preview/[form]`), e.g. to show them to an advisor. Admins
 * always can; others via the comma-separated `SURVEY_PREVIEW_EMAILS`.
 */
export function canPreviewSurveys(user: { email: string }): boolean {
  return isSurveyAdmin(user) || emailIn(env.SURVEY_PREVIEW_EMAILS, user.email);
}
