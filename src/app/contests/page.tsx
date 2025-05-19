import { auth } from "@/server/auth";
import { HydrateClient, api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { BreadCrumbs } from "../_components/breadcrumbs";
import { ContestList } from "../_components/contests/list";

export default async function ContestsPage() {
	const session = await auth();

	if (!session) {
		redirect("/api/auth/signin");
	}

	if (session) {
		void api.contest.findAll.prefetch();
	}

	return (
		<HydrateClient>
			<div className="flex w-full flex-col items-center justify-center p-4">
				<BreadCrumbs />
				<ContestList />
			</div>
		</HydrateClient>
	);
}
