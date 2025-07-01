'use client';

import type { Prisma } from '@prisma/client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { formatDuration } from '@/lib/format-duration';

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
	const [now, setNow] = useState(new Date());
	const t = useTranslations('ContestsPage');

	function getStatus(start: Date, end: Date) {
		if (now < start) {
			const diffMs = start.getTime() - now.getTime();
			return `${t('card.starts')}: ${formatDuration(diffMs)}`;
		}

		if (start <= now && now <= end) {
			const diffMs = end.getTime() - now.getTime();
			return `${t('card.ends')}: ${formatDuration(diffMs)}`;
		}

		return t('card.finished');
	}
	return (
		<div>
			<div className="flex gap-2">
				<p>{t('Tabs.Description.starts')}: </p>
				{new Intl.DateTimeFormat('en-US', {
					dateStyle: 'medium',
					timeStyle: 'short',
				}).format(contest.start)}
			</div>
			<div className="flex gap-2">
				<p>{t('Tabs.Description.ends')}: </p>
				{new Intl.DateTimeFormat('en-US', {
					dateStyle: 'medium',
					timeStyle: 'short',
				}).format(contest.end)}
			</div>
			<div>
				{t('Tabs.Description.participants')}: {contest.userOnContest.length}
			</div>
			<div>
				{t('Tabs.Description.problems')}: {contest.problems.length}
			</div>
		</div>
	);
}
