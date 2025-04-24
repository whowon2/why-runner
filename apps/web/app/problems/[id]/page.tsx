import { SubmissionList } from "@/components/submissions/list";
import { UploadSubmission } from "@/components/submissions/upload";
import { problemsService } from "@/lib/problems/service";
import { ProblemExamples } from "@/components/problems/examples";
import { DifficultyBadge } from "@/components/problems/difficulty-badge";

export default async function ProblemPage({
	params,
}: {
	params: { id: string };
}) {
	const { id } = params;
	const problem = await problemsService.find(id);

	if (!problem) {
		return (
			<div className="p-8 text-red-600 font-semibold">Problem not found.</div>
		);
	}

	return (
		<div className="w-full flex-col p-8 flex gap-8 justify-center">
			<div className="grid lg:grid-cols-2 gap-8">
				<div className="flex flex-col flex-1/2 gap-8">
					<div className="flex justify-between items-center">
						<h1 className="text-3xl font-bold mb-2">{problem.title}</h1>
						<DifficultyBadge difficulty={problem.difficulty} />
					</div>

					<section className="">
						<h2 className="text-xl font-semibold mb-2">Description</h2>
						<pre className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-md border">
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
