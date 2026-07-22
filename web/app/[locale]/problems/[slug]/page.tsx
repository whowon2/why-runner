import { notFound } from "next/navigation";
import { getProblemBySlug } from "@/lib/actions/problems/get-problem-by-slug";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { ProblemPageHeader } from "../_components/header";
import { ProblemWorkspace } from "../_components/workspace";

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireOnboardedUser({ redirectTo: "/auth/signin" });
  const problem = await getProblemBySlug(slug);

  if (!problem) notFound();

  return (
    <div className="flex w-full flex-col flex-1 items-center justify-center gap-4 p-4">
      <ProblemPageHeader problemId={problem.id} />
      <ProblemWorkspace problem={problem} />
    </div>
  );
}
