import { Contest } from "@/app/_components/contests/problems/list";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";

export default async function ContestPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const session = await auth();

	if (!session) {
		return <div>Unauthorized</div>;
	}

	const contest = await api.contest.findOne(id);

	if (!contest) {
		return <div>Contest not found</div>;
	}

	return <Contest id={id} session={session} />;
}
