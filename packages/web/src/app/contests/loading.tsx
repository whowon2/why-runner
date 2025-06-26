import { BreadCrumbs } from '@/components/breadcrumbs';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateContestDialog } from '../../components/contests/create/dialog';

export default async function Loading() {
	return (
		<div className="flex w-full flex-col items-center justify-center gap-4 p-4">
			<BreadCrumbs />

			<div className="flex w-full max-w-7xl flex-col gap-4">
				<div className="flex justify-between">
					<h1 className="font-bold text-2xl">Contests</h1>
					<CreateContestDialog />
				</div>

				<div className="flex flex-col justify-between gap-1 rounded-lg border p-4">
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-4 w-32" />
				</div>
			</div>
		</div>
	);
}
