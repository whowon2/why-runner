import "server-only";

import { env } from "@/env";
import { isAdmin } from "@/lib/auth/permissions";

function emailIn(list: string | undefined, email: string): boolean {
  const allowed = (list ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}

/**
 * Whether this user may see evaluation survey results: platform admins only
 * (`user.role`). `SURVEY_ADMIN_EMAILS` no longer grants access at runtime;
 * it only feeds `scripts/seed-admins.ts`.
 */
export function isSurveyAdmin(user: { id: string }): Promise<boolean> {
  return isAdmin(user.id);
}

/**
 * Whether this user may open the read-only previews of every form
 * (`/surveys/preview/[form]`), e.g. to show them to an advisor. Admins
 * always can; others via the comma-separated `SURVEY_PREVIEW_EMAILS`.
 */
export async function canPreviewSurveys(user: {
  id: string;
  email: string;
}): Promise<boolean> {
  return (
    emailIn(env.SURVEY_PREVIEW_EMAILS, user.email) || (await isAdmin(user.id))
  );
}
