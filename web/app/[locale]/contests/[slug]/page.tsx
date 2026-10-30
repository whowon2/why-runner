import { notFound } from "next/navigation";
import { SurveyCta } from "@/components/survey-cta";
import { getContestBySlug } from "@/lib/actions/contest/get-contest-by-id";
import { requireUser } from "@/lib/auth/require-user";
import { ContestDescription } from "../_components/description";
import { ContestTabs } from "../_components/tabs";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const user = await requireUser({ redirectTo: "/auth/signin" });

  const contest = await getContestBySlug(slug);

  // Drafts are already hidden from anyone but the creator and admins.
  if (!contest) notFound();

  return (
    <div className="flex w-full flex-col flex-1 items-center justify-center gap-4 p-4">
      <SurveyCta kind="contest" entityId={contest.id} className="max-w-6xl" />
      <ContestDescription contestId={contest.id} />
      <ContestTabs user={user} id={contest.id} />
    </div>
  );
}
