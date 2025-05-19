import { BreadCrumbs } from "@/app/_components/breadcrumbs";
import { EditContest } from "@/app/_components/contests/edit/edit";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function Page({
	params,
}: { params: Promise<{ id: string }> }) {
	const { id } = await params;

	const session = await auth();

	if (!session) {
		redirect("/api/auth/signin");
	}

	const contest = await api.contest.findById(id);

	if (!contest) {
		return <div>Contest Not Found</div>;
	}

	return (
		<div className="flex flex-col items-center justify-center">
			<BreadCrumbs />
			<EditContest contest={contest} session={session} />
		</div>
	);
}
