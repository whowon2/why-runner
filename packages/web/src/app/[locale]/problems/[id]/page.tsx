import { BreadCrumbs } from '@/components/breadcrumbs';
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
		return <div>Problem não encontrado</div>;
	}

	return (
		<div className="flex w-full flex-col flex-1 items-center justify-center gap-4 p-4">
			<BreadCrumbs />
			<div className="flex flex-1 flex-col gap-8">
				<ProblemDescription problem={problem} />
			</div>
		</div>
	);
}
