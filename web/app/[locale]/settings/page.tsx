import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { SettingsContent } from "./_components/settings-content";

export default async function SettingsPage() {
  await requireOnboardedUser({ redirectTo: "/auth/signin" });

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 p-4 py-8">
        <SettingsContent />
      </div>
    </div>
  );
}
