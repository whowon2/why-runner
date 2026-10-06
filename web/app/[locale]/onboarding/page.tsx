import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getProfile } from "@/lib/actions/get-profile";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { safeRedirectPath } from "@/lib/auth/redirect-path";
import { OnboardingForm } from "./_components/onboarding-form";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const currentUser = await getCurrentUser({ redirectTo: "/auth/signin" });
  const profile = await getProfile(currentUser.id);
  const locale = await getLocale();
  const redirectTo = safeRedirectPath((await searchParams).redirectTo);

  if (profile?.finishedOnboarding) {
    redirect({ href: redirectTo, locale });
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4">
      <OnboardingForm redirectTo={redirectTo} />
    </div>
  );
}
