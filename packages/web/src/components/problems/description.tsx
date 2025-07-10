import type { Problem } from '@prisma/client';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DifficultyBadge } from './badge';
import { ProblemExamples } from './examples';

export function ProblemDescription({ problem }: { problem: Problem }) {
	const t = useTranslations('ContestsPage');

	return (
		<div className="flex w-full flex-col gap-4">
			<Card className="bg-transparent shadow-none">
				<CardHeader>
					<CardTitle className="font-semibold text-xl">
						<h1 className="font-bold text-3xl">{problem.title}</h1>
						<DifficultyBadge difficulty={problem.difficulty} />
					</CardTitle>
				</CardHeader>
				<CardContent>
					<pre className="whitespace-pre-wrap rounded-md ">
						{problem.description}
					</pre>

					<h2 className="my-4 font-semibold text-xl">
						{t('Tabs.Problem.Examples.title')}
					</h2>

					<ProblemExamples inputs={problem.inputs} outputs={problem.outputs} />
				</CardContent>
			</Card>
		</div>
	);
}
