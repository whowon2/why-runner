import { BreadCrumbs } from "@/components/header/breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";

export default async function Loading() {
	return (
		<div className="flex w-full flex-col items-center justify-center gap-8 p-8">
			<BreadCrumbs />
		</div>
	);
}
