import { DifficultyBadge } from '@/components/problems/badge';
import { ProblemDescription } from '@/components/problems/description';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/trpc/server';

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
		<div className="flex w-full flex-col justify-center gap-8 p-8">
			<div className="flex flex-1/2 flex-col gap-8">
				<div className="flex items-center justify-between">
					<h1 className="mb-2 font-bold text-3xl">{problem.title}</h1>
					<DifficultyBadge difficulty={problem.difficulty} />
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="font-semibold text-xl">Description</CardTitle>
					</CardHeader>
					<CardContent>
						<pre className="whitespace-pre-wrap rounded-md ">
							{problem.description}
						</pre>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="font-semibold text-xl">Examples</CardTitle>
					</CardHeader>
					<CardContent>
						<ProblemDescription problem={problem} />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
