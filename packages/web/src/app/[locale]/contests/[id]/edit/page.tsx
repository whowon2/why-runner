import { redirect } from 'next/navigation';
import { BreadCrumbs } from '@/components/breadcrumbs';
import { EditContest } from '@/components/contests/edit/edit';
import { auth } from '@/server/auth';
import { api } from '@/trpc/server';

export default async function Page({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const session = await auth();

	if (!session) {
		redirect('/api/auth/signin');
	}

	const contest = await api.contest.findById(id);

	if (!contest) {
		return <div>Contest Not Found</div>;
	}

	return (
		<div className="flex flex-col items-center justify-center">
			<BreadCrumbs />
			<EditContest contest={contest} />
		</div>
	);
}
