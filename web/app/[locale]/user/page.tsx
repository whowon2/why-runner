import { Suspense } from "react";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import Profile from "./_components/profile";
import { ProfileTabs } from "./_components/tabs";

export default async function ProfilePage() {
  const user = await requireOnboardedUser({ redirectTo: "/auth/signin" });

  return (
    <div className="w-full min-h-screen bg-background relative">
      {/* Decorative ambient background blur */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-indigo-500/10 blur-[100px] rounded-none mix-blend-multiply pointer-events-none dark:bg-indigo-500/20" />

      <div className="max-w-5xl mx-auto flex flex-col gap-8 p-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Profile userId={user.id} isOwner={true} />

        <div className="flex w-full flex-col gap-8 mt-4">
          <Suspense fallback={null}>
            <ProfileTabs userId={user.id} isOwner={true} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
