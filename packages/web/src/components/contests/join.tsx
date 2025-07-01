'use client';

import type { Prisma } from '@prisma/client';
import type { Session } from 'next-auth';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';
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
	const t = useTranslations('ContestsPage.JoinButton');
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

	if (contest.start < new Date()) {
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
							onError: (error) => {
								toast.error(t('Leave.error'), {
									description: error.message,
								});
							},
							onSuccess: () => {
								toast(t('Leave.success'));
								router.refresh();
								utils.contest.getLeaderboard.invalidate();
							},
						},
					);
				}}
				variant={'destructive'}
			>
				Sair
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
						onError: (error) => {
							toast.error(t('Join.error'), {
								description: error.message,
							});
						},
						onSuccess: () => {
							toast(t('Join.success'));
							router.refresh();
							utils.contest.getLeaderboard.invalidate();
						},
					},
				);
			}}
			variant={'outline'}
		>
			Entrar
		</Button>
	);
}
