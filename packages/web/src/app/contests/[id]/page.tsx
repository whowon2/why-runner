import { ContestDescription } from "@/components/contests/description";
import { ContestHeader } from "@/components/contests/header";
import { BreadCrumbs } from "@/components/header/breadcrumbs";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";

export default async function Page({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const session = await auth();

	if (!session) {
		return <div>Unauthorized</div>;
	}

	const contest = await api.contest.findById(id);

	if (!contest) {
		return <div>Contest not found</div>;
	}

	return (
		<div className="flex w-full flex-col items-center justify-center gap-4 p-4">
			<BreadCrumbs />
			<ContestHeader contest={contest} session={session} />
			<ContestDescription contest={contest} />
		</div>
	);
}
