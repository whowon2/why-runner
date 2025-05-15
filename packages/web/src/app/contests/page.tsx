import { ContestList } from "@/components/contests/contest-list";
import { BreadCrumbs } from "@/components/header/breadcrumbs";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function ContestsPage() {
	const session = await auth();

	if (!session) {
		redirect("/api/auth/signin");
	}

	const contests = await api.contest.findAll();

	return (
		<div className="flex w-full flex-col items-center justify-center p-4">
			<BreadCrumbs />
			<ContestList session={session} contests={contests} />
		</div>
	);
}
