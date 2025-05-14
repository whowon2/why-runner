import { BreadCrumbs } from "@/components/header/breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";

export default async function Loading() {
	return (
		<div className="flex w-full flex-col items-center justify-center gap-8 p-8">
			<BreadCrumbs />
			<div className="flex w-full max-w-7xl flex-col gap-4">
				<Skeleton className="h-96 w-full" />
			</div>
		</div>
	);
}
