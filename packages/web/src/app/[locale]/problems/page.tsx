import { redirect } from 'next/navigation';
import { BreadCrumbs } from '@/components/breadcrumbs';
import { ProblemsList } from '@/components/problems/list';
import { auth } from '@/server/auth';

export default async function ProblemsPage() {
	const session = await auth();

	if (!session) {
		redirect('/api/auth/signin');
	}

	return (
		<div className="flex w-full flex-1 flex-col items-center justify-center gap-4 p-4">
			<BreadCrumbs />
			<ProblemsList session={session} />
		</div>
	);
}
