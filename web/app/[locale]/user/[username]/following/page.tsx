import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FollowList } from "@/components/follow-list";
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
    <div className="max-w-lg mx-auto flex flex-col gap-6 p-4 py-8">
      <h1 className="text-xl font-bold">
        {t("followingTitle")} · @{username}
      </h1>
      <FollowList
        username={username}
        tab="following"
        currentUserId={currentUser.id}
      />
    </div>
  );
}
