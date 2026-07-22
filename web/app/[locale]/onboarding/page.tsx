import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getProfile } from "@/lib/actions/get-profile";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { OnboardingForm } from "./_components/onboarding-form";

export default async function OnboardingPage() {
  const currentUser = await getCurrentUser({ redirectTo: "/auth/signin" });
  const profile = await getProfile(currentUser.id);
  const locale = await getLocale();

  if (profile?.finishedOnboarding) {
    redirect({ href: "/", locale });
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4">
      <OnboardingForm />
    </div>
  );
}
