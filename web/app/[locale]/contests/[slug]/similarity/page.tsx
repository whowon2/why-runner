import { notFound } from "next/navigation";
import { db } from "@/drizzle/db";
import { getContestBySlug } from "@/lib/actions/contest/get-contest-by-id";
import { requireUser } from "@/lib/auth/require-user";
import { letters } from "@/lib/letters";
import { ContestSimilarity } from "../../_components/similarity";

export default async function ContestSimilarityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireUser({ redirectTo: "/auth/signin" });
  const { slug } = await params;

  const contest = await getContestBySlug(slug);
  // Contest owner or admin; `getContestProblemSimilarity` enforces this again.
  if (!contest?.canManage) notFound();

  const attached = await db.query.problemOnContest.findMany({
    where: (p, { eq }) => eq(p.contestId, contest.id),
    orderBy: (p, { asc }) => [asc(p.order)],
    with: { problem: { columns: { id: true, title: true } } },
  });

  return (
    <div className="flex w-full flex-1 flex-col items-center gap-4 p-4">
      <ContestSimilarity
        contestId={contest.id}
        contestName={contest.name}
        contestSlug={contest.slug}
        problems={attached.map((a, i) => ({
          id: a.problem.id,
          letter: letters[i] ?? String(i + 1),
          title: a.problem.title,
        }))}
      />
    </div>
  );
}
