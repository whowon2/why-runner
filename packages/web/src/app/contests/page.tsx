import { ContestList } from "@/components/contests/contest-list";
import { BreadCrumbs } from "@/components/header/breadcrumbs";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function ContestsPage() {
	const session = await auth();

	if (!session) {
		redirect("/api/auth/signin");
	}

	return (
		<div className="flex w-full flex-col items-center justify-center gap-8 p-8">
			<BreadCrumbs />
			<ContestList session={session} />
		</div>
	);
}
