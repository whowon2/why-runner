"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import type { Prisma } from "@prisma/client";
import type { Session } from "next-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function JoinButton({
	contest,
	session,
	isCreatedByUser,
}: {
	contest: Prisma.ContestGetPayload<{ include: { userOnContest: true } }>;
	session: Session;
	isCreatedByUser: boolean;
}) {
	const { mutate: joinContest, isPending: isJoinPending } =
		api.contest.join.useMutation();
	const { mutate: leaveContest, isPending: isLeavePending } =
		api.contest.leave.useMutation();

	const router = useRouter();

	const isUserInContest = contest.userOnContest.some(
		(user) => user.userId === session?.user.id,
	);

	if (isCreatedByUser) {
		return null;
	}

	useEffect(() => {
		console.log("fodase");
	}, []);

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
						{ contestId: contest.id },
						{
							onSuccess: () => {
								router.refresh();
								toast("You have left the contest.");
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
					{ contestId: contest.id },
					{
						onSuccess: () => {
							toast("You have joined the contest.");
							router.refresh();
						},
					},
				);
			}}
		>
			Join
		</Button>
	);
}
