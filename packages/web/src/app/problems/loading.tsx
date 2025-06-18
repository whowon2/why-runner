import Link from 'next/link';
import { BreadCrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DifficultyBadge } from '../../components/problems/badge';

export default async function Loading() {
	return (
		<div className="flex w-full flex-col items-center justify-center gap-4 p-4">
			<BreadCrumbs />
			<div className="w-full max-w-7xl">
				<div className="flex justify-between">
					<h1 className="font-bold text-2xl">Problems</h1>
					<Link href={'/problems/new'}>
						<Button variant={'outline'}>New Problem</Button>
					</Link>
				</div>
				<div>
					<div className="my-2 flex justify-between rounded-lg border p-4">
						<Skeleton className="h-6 w-32" />
						<DifficultyBadge difficulty={'none'} />
					</div>
				</div>
			</div>
		</div>
	);
}
