'use client';

import type { Contest } from '@prisma/client';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { formatDuration } from '@/lib/format-duration';

export function ContestStatus({ contest }: { contest: Contest }) {
	const [now, setNow] = useState(new Date());

	useEffect(() => {
		const interval = setInterval(() => {
			setNow(new Date());
		}, 1000);
		return () => clearInterval(interval);
	}, []);

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
		<div className="flex flex-col items-center justify-center">
			{getStatus(contest.start, contest.end)}
		</div>
	);
}
