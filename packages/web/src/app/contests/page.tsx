import { BreadCrumbs } from "@/components/breadcrumbs";
import { ContestList } from "@/components/contests/list";
import { auth } from "@/server/auth";
import { HydrateClient, api } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function ContestsPage() {
	const session = await auth();

	if (!session) {
		redirect("/api/auth/signin");
	}

	void api.contest.findAll.prefetch();

	return (
		<HydrateClient>
			<div className="flex w-full flex-col items-center justify-center gap-4 p-4">
				<BreadCrumbs />
				<ContestList />
			</div>
		</HydrateClient>
	);
}
