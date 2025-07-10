'use client';

import type { Prisma } from '@prisma/client';
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
