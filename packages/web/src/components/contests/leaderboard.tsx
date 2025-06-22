'use client';

import type { Contest } from '@prisma/client';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { api } from '@/trpc/react';

export function Leaderboard({ contest }: { contest: Contest }) {
	const { data: leaderboard } = api.contest.getLeaderboard.useQuery(
		{
			contestId: contest.id,
		},
		{
			refetchInterval: 10000,
			// refetchOnMount: true,
		},
	);

	return (
		<div>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[100px]">Name</TableHead>
						<TableHead className="text-center">Correct</TableHead>
						<TableHead className="text-right">Score</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{leaderboard?.map((user) => (
						<TableRow key={user.id}>
							<TableCell className="font-medium">{user.user.name}</TableCell>
							<TableCell className="font-medium text-center">
								{user.answers?.map((question, idx) => (
									<div key={idx}>{question}</div>
								))}
							</TableCell>
							<TableCell className="text-right">{user.score}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
