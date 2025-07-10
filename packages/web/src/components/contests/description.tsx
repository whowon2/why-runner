'use client';

import type { Prisma } from '@prisma/client';
import { CalendarDays, ListOrdered, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ContestDescription({
	contest,
}: {
	contest: Prisma.ContestGetPayload<{
		include: {
			problems: true;
			userOnContest: true;
		};
	}>;
}) {
	const t = useTranslations('ContestsPage');

	const formatDate = (date: Date) =>
		new Intl.DateTimeFormat('en-US', {
			dateStyle: 'medium',
			timeStyle: 'short',
		}).format(new Date(date));

	return (
		<div className="flex flex-col items-center justify-center gap-2 mt-8">
			<div className="flex items-center gap-3">
				<CalendarDays className="w-4 h-4 text-primary" />
				<span className="font-medium">{t('Tabs.Description.starts')}:</span>
				<span>{formatDate(contest.start)}</span>
			</div>

			<div className="flex items-center gap-3">
				<CalendarDays className="w-4 h-4 text-primary" />
				<span className="font-medium">{t('Tabs.Description.ends')}:</span>
				<span>{formatDate(contest.end)}</span>
			</div>

			<div className="flex items-center gap-3">
				<Users className="w-4 h-4 text-primary" />
				<span className="font-medium">
					{t('Tabs.Description.participants')}:
				</span>
				<span>{contest.userOnContest.length}</span>
			</div>

			<div className="flex items-center gap-3">
				<ListOrdered className="w-4 h-4 text-primary" />
				<span className="font-medium">{t('Tabs.Description.problems')}:</span>
				<span>{contest.problems.length}</span>
			</div>
		</div>
	);
}
