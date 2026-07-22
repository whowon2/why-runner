import { notFound } from "next/navigation";
import { getProblemBySlug } from "@/lib/actions/problems/get-problem-by-slug";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { ProblemWorkspace } from "../_components/workspace";

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await getCurrentUser({ redirectTo: "/auth/signin" });
  const problem = await getProblemBySlug(slug);

  if (!problem) notFound();

  return (
    <div className="flex w-full flex-col flex-1 items-center justify-center gap-4 p-4">
      <ProblemWorkspace problem={problem} />
    </div>
  );
}
