import { getCurrentUser } from "@/lib/auth/get-current-user";
import Profile from "./_components/profile";
import { ProfileTabs } from "./_components/tabs";

export default async function ProfilePage() {
  const user = await getCurrentUser({ redirectTo: "/auth/signin" });

  return (
    <div className="w-full min-h-screen bg-background relative">
      {/* Decorative ambient background blur */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-indigo-500/10 blur-[100px] rounded-full mix-blend-multiply pointer-events-none dark:bg-indigo-500/20" />

      <div className="max-w-5xl mx-auto flex flex-col gap-8 p-4 py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Profile user={user} />

        <div className="flex w-full flex-col gap-8 mt-4">
          <ProfileTabs />
        </div>
      </div>
    </div>
  );
}
