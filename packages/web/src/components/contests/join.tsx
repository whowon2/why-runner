'use client';

import type { Prisma } from '@prisma/client';
import { useRouter } from 'next/navigation';
import type { Session } from 'next-auth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { api } from '@/trpc/react';

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
	const utils = api.useUtils();

	const isUserInContest = contest.userOnContest.some(
		(user) => user.userId === session?.user.id,
	);

	if (isCreatedByUser) {
		return null;
	}

	if (isUserInContest) {
		return (
			<Button
				disabled={isLeavePending}
				onClick={() => {
					if (!session) {
						return;
					}

					leaveContest(
						{ contestId: contest.id },
						{
							onSuccess: () => {
								toast('You have left the contest.');
								router.refresh();
								utils.contest.getLeaderboard.invalidate();
							},
						},
					);
				}}
				variant={'destructive'}
			>
				Leave
			</Button>
		);
	}

	return (
		<Button
			disabled={isJoinPending}
			onClick={() => {
				if (!session) {
					return;
				}

				joinContest(
					{ contestId: contest.id },
					{
						onSuccess: () => {
							toast('You have joined the contest.');
							router.refresh();
							utils.contest.getLeaderboard.invalidate();
						},
					},
				);
			}}
			variant={'outline'}
		>
			Join
		</Button>
	);
}
