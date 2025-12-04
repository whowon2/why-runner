import { getCurrentUser } from "@/lib/auth/get-current-user";
import Profile from "./_components/profile";

import { ProfileTabs } from "./_components/tabs";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab: string }>;
}) {
  const user = await getCurrentUser({ redirectTo: "/auth/signin" });
  const { tab } = await searchParams;

  return (
    <div className="flex flex-col p-4 gap-8 container mx-auto">
      <Profile user={user} />

      <div className="flex w-full flex-col gap-6">
        <ProfileTabs user={user} tab={tab} />
      </div>
    </div>
  );
}
