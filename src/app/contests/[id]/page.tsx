import { BreadCrumbs } from "@/app/_components/breadcrumbs";
import { JoinButton } from "@/app/_components/contests/join";
import ContestTabs from "@/app/_components/contests/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { Pencil } from "lucide-react";
import Link from "next/link";

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

	const isCreatedByUser = contest.createdById === session.user.id;

	return (
		<div className="flex w-full flex-col items-center justify-center gap-4 p-4">
			<BreadCrumbs />
			<div className="flex flex-col items-center">
				<div className="flex gap-2">
					<h1 className="font-bold text-3xl">{contest.name}</h1>
					{isCreatedByUser && (
						<Link href={`${contest.id}/edit`}>
							<Pencil size={18} />
						</Link>
					)}
				</div>
				<JoinButton
					contest={contest}
					session={session}
					isCreatedByUser={isCreatedByUser}
				/>
			</div>
			<Card className="w-full">
				<CardHeader>
					<CardTitle>Description</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex gap-2">
						<p>Starts at: </p>
						{new Intl.DateTimeFormat("en-US", {
							dateStyle: "medium",
							timeStyle: "short",
						}).format(contest.start)}
					</div>
					<div className="flex gap-2">
						<p>Ends at: </p>
						{new Intl.DateTimeFormat("en-US", {
							dateStyle: "medium",
							timeStyle: "short",
						}).format(contest.end)}
					</div>
					<div>Participants: {contest.userOnContest.length}</div>
					<div>Problems: {contest.problems.length}</div>
				</CardContent>
			</Card>

			<Card className="w-full">
				<CardContent>
					<ContestTabs contest={contest} />
				</CardContent>
			</Card>
		</div>
	);
}
