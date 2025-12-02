import { BreadCrumbs } from "@/components/breadcrumbs";
import { ProblemDescription } from "../_components/description";

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const { id } = await params;

  return (
    <div className="flex w-full flex-col flex-1 items-center justify-center gap-4 p-4">
      <BreadCrumbs />
      <div className="flex flex-1 flex-col gap-8">
        <ProblemDescription problemId={id} />
      </div>
    </div>
  );
}
