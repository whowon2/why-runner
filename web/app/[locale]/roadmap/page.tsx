import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";

export default async function RoadmapPage() {
  await requireOnboardedUser({ redirectTo: "/auth/signin" });
  const locale = await getLocale();
  redirect({ href: "/classes", locale });
}
