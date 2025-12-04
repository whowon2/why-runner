import { getCurrentUser } from "@/lib/auth/get-current-user";
import Profile from "./_components/profile";

import { ProfileTabs } from "./_components/tabs";

export default async function ProfilePage() {
  const user = await getCurrentUser({ redirectTo: "/auth/signin" });

  return (
    <div className="flex w-full flex-col flex-1 items-center  gap-4 p-4">
      <Profile user={user} />

      <div className="flex w-full flex-col gap-6">
        <ProfileTabs user={user} />
      </div>
    </div>
  );
}
