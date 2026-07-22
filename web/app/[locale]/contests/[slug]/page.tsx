import { notFound } from "next/navigation";
import { getContestBySlug } from "@/lib/actions/contest/get-contest-by-id";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { ContestDescription } from "../_components/description";
import { ContestTabs } from "../_components/tabs";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const user = await requireOnboardedUser({ redirectTo: "/auth/signin" });

  const contest = await getContestBySlug(slug);

  if (!contest) notFound();
  if (contest.status === "draft" && contest.createdBy !== user.id) notFound();

  return (
    <div className="flex w-full flex-col flex-1 items-center justify-center gap-4 p-4">
      <ContestDescription contestId={contest.id} />
      <ContestTabs user={user} id={contest.id} />
    </div>
  );
}
