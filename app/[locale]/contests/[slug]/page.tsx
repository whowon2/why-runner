import { notFound } from "next/navigation";
import { BreadCrumbs } from "@/components/breadcrumbs";
import { getContestBySlug } from "@/lib/actions/contest/get-contest-by-id";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { ContestDescription } from "../_components/description";
import { ContestTabs } from "../_components/tabs";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const contest = await getContestBySlug(slug);

  if (!contest) notFound();

  const user = await getCurrentUser({ redirectTo: "/auth/signin" });

  return (
    <div className="flex w-full flex-col flex-1 items-center justify-center gap-4 p-4">
      <BreadCrumbs />
      <ContestDescription contestId={contest.id} />
      <ContestTabs user={user} id={contest.id} />
    </div>
  );
}
