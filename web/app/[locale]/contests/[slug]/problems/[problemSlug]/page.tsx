import { notFound } from "next/navigation";
import { getContestBySlug } from "@/lib/actions/contest/get-contest-by-id";
import { requireUser } from "@/lib/auth/require-user";
import { ContestProblemWorkspace } from "./_components/contest-problem-workspace";

/** One contest problem in the fullscreen editor workspace. */
export default async function ContestProblemPage({
  params,
}: {
  params: Promise<{ slug: string; problemSlug: string }>;
}) {
  const { slug, problemSlug } = await params;
  const user = await requireUser({ redirectTo: "/auth/signin" });
  const contest = await getContestBySlug(slug);
  if (!contest) notFound();

  return (
    <ContestProblemWorkspace
      contestId={contest.id}
      problemSlug={problemSlug}
      userId={user.id}
    />
  );
}
