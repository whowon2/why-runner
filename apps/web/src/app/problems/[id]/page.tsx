import { DifficultyBadge } from "@/components/problems/diff-badge";
import { UploadSubmission } from "@/components/problems/editor";
import { ProblemExamples } from "@/components/problems/examples";
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
		return <div>Contest not found</div>;
	}

	return (
		<div className="flex w-full flex-col justify-center gap-8 p-8">
			<div className="grid gap-8 lg:grid-cols-2">
				<div className="flex flex-1/2 flex-col gap-8">
					<div className="flex items-center justify-between">
						<h1 className="mb-2 font-bold text-3xl">{problem.title}</h1>
						<DifficultyBadge difficulty={problem.difficulty} />
					</div>

					<section className="">
						<h2 className="mb-2 font-semibold text-xl">Description</h2>
						<pre className="whitespace-pre-wrap rounded-md border bg-gray-50 p-4 text-gray-700">
							{problem.description}
						</pre>
					</section>

					<section className="">
						<ProblemExamples
							inputs={problem.inputs}
							outputs={problem.outputs}
						/>
					</section>
				</div>

				<UploadSubmission problem={problem} />
			</div>

			<SubmissionList submissions={problem.submissions} />
		</div>
	);
}
