import { redirect } from 'next/navigation';
import { BreadCrumbs } from '@/components/breadcrumbs';
import { auth } from '@/server/auth';
import { api, HydrateClient } from '@/trpc/server';
import { ProblemsList } from '../../components/problems/list';

export default async function ProblemsPage() {
	const session = await auth();

	if (!session) {
		redirect('/api/auth/signin');
	}

	void api.problem.getAll.prefetch({});

	return (
		<HydrateClient>
			<div className="flex w-full flex-col items-center justify-center gap-4 p-4">
				<BreadCrumbs />
				<ProblemsList />
			</div>
		</HydrateClient>
	);
}
