import { getLocale } from "next-intl/server";
import { db } from "@/drizzle/db";
import { redirect } from "@/i18n/navigation";
import { getCurrentPath } from "./current-path";
import { getCurrentUser } from "./get-current-user";
import { withRedirectTo } from "./redirect-path";

export async function requireOnboardedUser({
  redirectTo,
}: {
  redirectTo?: string;
}) {
  const currentUser = await getCurrentUser({ redirectTo });

  // session.user.finishedOnboarding can be stale: Better Auth caches the
  // session in a cookie for a few minutes, so a flag just flipped by
  // completeOnboarding() may not show up there yet. Read it fresh from the
  // DB instead of trusting the cached session field.
  const freshUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.id, currentUser.id),
    columns: { finishedOnboarding: true },
  });

  if (!freshUser?.finishedOnboarding) {
    const locale = await getLocale();
    redirect({
      href: withRedirectTo("/onboarding", await getCurrentPath()),
      locale,
    });
    throw new Error("User has not finished onboarding");
  }

  return currentUser;
}
