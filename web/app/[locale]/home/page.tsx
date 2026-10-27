import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { HomeDashboard } from "./_components/home-dashboard";

export default async function HomePage() {
  await requireOnboardedUser({ redirectTo: "/auth/signin" });

  return (
    <div className="flex w-full flex-1 flex-col items-center gap-4 p-4">
      <HomeDashboard />
    </div>
  );
}
