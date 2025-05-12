"use client";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import type { Prisma } from "@runner/db";
import type { Session } from "next-auth";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";

export function ContestCard({
	contest,
	refetchAction,
}: {
	contest: Prisma.ContestGetPayload<{ include: { UserOnContest: true } }>;
	refetchAction: () => void;
}) {
	const { data: session } = useSession();

	const isCreatedByUser = contest.createdById === session?.user.id;

	if (!session) {
		return null;
	}

	return (
		<div
			key={contest.id}
			className={`my-2 flex justify-between rounded-lg border p-4 ${isCreatedByUser && "border-blue-600"}`}
		>
			<h3 className="font-bold">{contest.name}</h3>
			<div className="flex gap-4">
				<JoinButton
					contest={contest}
					session={session}
					refetch={refetchAction}
					isCreatedByUser={isCreatedByUser}
				/>

				<Link href={`/contests/${contest.id}`}>
					<Button variant={"link"}>View</Button>
				</Link>
			</div>
		</div>
	);
}

function JoinButton({
	contest,
	session,
	refetch,
	isCreatedByUser,
}: {
	contest: Prisma.ContestGetPayload<{ include: { UserOnContest: true } }>;
	session: Session;
	refetch: () => void;
	isCreatedByUser: boolean;
}) {
	const { mutate: joinContest, isPending: isJoinPending } =
		api.contest.join.useMutation();
	const { mutate: leaveContest, isPending: isLeavePending } =
		api.contest.leave.useMutation();

	const isUserInContest = contest.UserOnContest.some(
		(user) => user.userId === session?.user.id,
	);

	if (isCreatedByUser) {
		return null;
	}

	if (isUserInContest) {
		return (
			<Button
				variant={"destructive"}
				disabled={isLeavePending}
				onClick={() => {
					if (!session) {
						return;
					}

					leaveContest(
						{ contestId: contest.id, userId: session?.user.id },
						{
							onSuccess: () => {
								toast("You have left the contest.");
								refetch();
							},
						},
					);
				}}
			>
				Leave
			</Button>
		);
	}

	return (
		<Button
			variant={"outline"}
			disabled={isJoinPending}
			onClick={() => {
				if (!session) {
					return;
				}

				joinContest(
					{ contestId: contest.id, userId: session?.user.id },
					{
						onSuccess: () => {
							toast("You have joined the contest.");
							refetch();
						},
					},
				);
			}}
		>
			Join
		</Button>
	);
}
