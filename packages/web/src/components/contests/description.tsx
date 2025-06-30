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
	const t = useTranslations('ContestsPage.Tabs.Description');
	return (
		<div>
			<div className="flex gap-2">
				<p>{t('starts')}: </p>
				{new Intl.DateTimeFormat('en-US', {
					dateStyle: 'medium',
					timeStyle: 'short',
				}).format(contest.start)}
			</div>
			<div className="flex gap-2">
				<p>{t('ends')}: </p>
				{new Intl.DateTimeFormat('en-US', {
					dateStyle: 'medium',
					timeStyle: 'short',
				}).format(contest.end)}
			</div>
			<div>
				{t('participants')}: {contest.userOnContest.length}
			</div>
			<div>
				{t('problems')}: {contest.problems.length}
			</div>
		</div>
	);
}
