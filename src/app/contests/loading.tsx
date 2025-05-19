import { BreadCrumbs } from "../_components/breadcrumbs";

export default async function Loading() {
	return (
		<div className="flex w-full flex-col items-center justify-center gap-8 p-4">
			<BreadCrumbs />
		</div>
	);
}
