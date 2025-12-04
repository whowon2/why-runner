import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from ".";

export async function getCurrentUser({ redirectTo }: { redirectTo?: string }) {
  const session = await auth.api.getSession({ headers: await headers() });

  const locale = await getLocale();

  if (session) {
    return session.user;
  } else {
    redirect({ href: redirectTo || "/", locale });
    throw new Error("User not authenticated");
  }
}
