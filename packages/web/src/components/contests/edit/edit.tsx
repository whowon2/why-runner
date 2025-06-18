import type { Prisma } from '@prisma/client';
import type { Session } from 'next-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EditContestForm } from './form';
import { EditContestProblems } from './problems/edit';

export function EditContest({
	contest,
	session,
}: {
	contest: Prisma.ContestGetPayload<{
		include: {
			problems: true;
		};
	}>;
	session: Session;
}) {
	return (
		<div className="flex w-full flex-col gap-4 p-4">
			<Card>
				<CardHeader>
					<CardTitle>Contest</CardTitle>
				</CardHeader>
				<CardContent>
					<EditContestForm contest={contest} />
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Problems</CardTitle>
				</CardHeader>
				<CardContent>
					<EditContestProblems contest={contest} />
				</CardContent>
			</Card>
		</div>
	);
}
