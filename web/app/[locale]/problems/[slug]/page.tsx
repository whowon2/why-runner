import { notFound } from "next/navigation";
import { BreadCrumbs } from "@/components/breadcrumbs";
import { getProblemBySlug } from "@/lib/actions/problems/get-problem-by-slug";
import { ProblemDescription } from "../_components/description";

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const problem = await getProblemBySlug(slug);

  if (!problem) notFound();

  return (
    <div className="flex w-full flex-col flex-1 items-center justify-center gap-4 p-4">
      <BreadCrumbs />
      <div className="flex flex-1 flex-col gap-8">
        <ProblemDescription problemId={problem.id} />
      </div>
    </div>
  );
}
