import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FollowList } from "@/components/follow-list";
import { FollowTabs } from "@/components/follow-tabs";
import { getUserByUsername } from "@/lib/actions/get-user-by-username";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";

export default async function FollowingPage({
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

  const t = await getTranslations("FollowList");

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
      <h1 className="text-xl font-bold">@{username}</h1>
      <FollowTabs username={username} active="following" />
      <div className="max-w-lg w-full mx-auto">
        <h2 className="sr-only">{t("followingTitle")}</h2>
        <FollowList
          username={username}
          tab="following"
          currentUserId={currentUser.id}
        />
      </div>
    </div>
  );
}
