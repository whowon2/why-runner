import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from ".";

export async function getCurrentUser({ redirectTo }: { redirectTo?: string }) {
  let session: Awaited<ReturnType<typeof auth.api.getSession>>;

  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch {
    const locale = await getLocale();
    redirect({ href: redirectTo || "/", locale });
    throw new Error("User not authenticated");
  }

  const locale = await getLocale();

  if (session) {
    return session.user;
  } else {
    redirect({ href: redirectTo || "/", locale });
    throw new Error("User not authenticated");
  }
}
