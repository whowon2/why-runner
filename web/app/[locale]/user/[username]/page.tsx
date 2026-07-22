import { notFound } from "next/navigation";
import { getUserByUsername } from "@/lib/actions/get-user-by-username";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import Profile from "../_components/profile";
import { ProfileTabs } from "../_components/tabs";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const currentUser = await requireOnboardedUser({
    redirectTo: "/auth/signin",
  });

  const profileUser = await getUserByUsername(username);
  if (!profileUser) notFound();

  const isOwner = profileUser.id === currentUser.id;

  return (
    <div className="w-full min-h-screen bg-background relative">
      {/* Decorative ambient background blur */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-indigo-500/10 blur-[100px] rounded-none mix-blend-multiply pointer-events-none dark:bg-indigo-500/20" />

      <div className="max-w-5xl mx-auto flex flex-col gap-8 p-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Profile userId={profileUser.id} isOwner={isOwner} />

        <div className="flex w-full flex-col gap-8 mt-4">
          <ProfileTabs userId={profileUser.id} isOwner={isOwner} />
        </div>
      </div>
    </div>
  );
}
