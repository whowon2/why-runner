import { ProblemDescription } from "@/components/problems/description";
import { UploadCode } from "@/components/problems/editor";
import { SubmissionList } from "@/components/problems/submission-list";
import { api } from "@/trpc/server";

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const problem = await api.problem.findOne(id);

  if (!problem) {
    return <div>Problem not found</div>;
  }

  return (
    <div className="flex w-full flex-col justify-center items-center gap-8 p-8">
      <div className="w-full max-w-7xl flex flex-col gap-4">
        <ProblemDescription problem={problem} />
        <UploadCode problem={problem} />
        <SubmissionList problemId={problem.id} />
      </div>
    </div>
  );
}
