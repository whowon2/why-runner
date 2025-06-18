import type { Problem } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DifficultyBadge } from './badge';
import { ProblemExamples } from './examples';

export function ProblemDescription({ problem }: { problem: Problem }) {
	return (
		<div className="flex w-full flex-col gap-4">
			<div className="flex items-center gap-2 p-4">
				<h1 className="font-bold text-3xl">{problem.title}</h1>
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

					<h2 className="my-4 font-semibold text-xl">Examples</h2>

					<ProblemExamples inputs={problem.inputs} outputs={problem.outputs} />
				</CardContent>
			</Card>
		</div>
	);
}
