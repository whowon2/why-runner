'use client';

import type { Prisma } from '@prisma/client';
import { Award } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { letters } from '@/lib/letters';
import { api } from '@/trpc/react';

function getAwardColor(idx: number) {
	const colors = [
		'green',
		'blue',
		'purple',
		'orange',
		'pink',
		'cyan',
		'magenta',
		'lime',
		'teal',
		'indigo',
		'violet',
		'gray',
		'yellow',
		'red',
	];
	return colors[idx % colors.length];
}

export function Leaderboard({
	contest,
}: {
	contest: Prisma.ContestGetPayload<{
		include: {
			problems: true;
		};
	}>;
}) {
	const t = useTranslations('ContestsPage.Tabs.Leaderboard');
	const { data: leaderboard } = api.contest.getLeaderboard.useQuery(
		{
			contestId: contest.id,
		},
		{
			refetchInterval: 10000,
		},
	);

	if (!leaderboard) return null;

	leaderboard.sort((a, b) => b.score - a.score);

	return (
		<div>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[100px]">{t('name')}</TableHead>
						{contest.problems.map((problem, idx) => (
							<TableHead key={problem.id} className="text-center">
								{letters[idx]}
							</TableHead>
						))}
						<TableHead className="text-right">{t('score')}</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{leaderboard?.map((user) => (
						<TableRow key={user.id}>
							<TableCell className="font-medium">{user.user.name}</TableCell>
							{user.answers.map((question, idx) => (
								<TableCell key={idx} className="text-center">
									<div className="flex justify-center">
										<Award color={getAwardColor(idx)} />
									</div>
								</TableCell>
							))}
							{Array.from(
								{ length: contest.problems.length - user.answers.length },
								(_, idx) => (
									<TableCell key={idx}></TableCell>
								),
							)}
							<TableCell className="text-right">{user.score}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
