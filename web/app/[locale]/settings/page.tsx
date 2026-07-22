import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { AppearanceSection } from "./_components/appearance-section";
import { SettingsNav } from "./_components/settings-nav";

export default async function SettingsPage() {
  await requireOnboardedUser({ redirectTo: "/auth/signin" });

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 p-4 py-8">
        <SettingsNav />

        <div className="flex-1 min-w-0">
          <AppearanceSection />
        </div>
      </div>
    </div>
  );
}
