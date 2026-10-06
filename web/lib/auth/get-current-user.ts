import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from ".";
import { getCurrentPath } from "./current-path";
import { withRedirectTo } from "./redirect-path";

export async function getCurrentUser({ redirectTo }: { redirectTo?: string }) {
  let session: Awaited<ReturnType<typeof auth.api.getSession>> = null;

  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch {}

  if (session) return session.user;

  const locale = await getLocale();
  // Sign-in remembers where the user was headed so it can send them back.
  const href =
    redirectTo === "/auth/signin"
      ? withRedirectTo(redirectTo, await getCurrentPath())
      : redirectTo || "/";
  redirect({ href, locale });
  throw new Error("User not authenticated");
}
