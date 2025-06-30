'use client';

import type { Prisma } from '@prisma/client';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';

export function ContestCard({
	contest,
}: {
	contest: Prisma.ContestGetPayload<{ include: { userOnContest: true } }>;
}) {
	const [now, setNow] = useState(new Date());
	const t = useTranslations('ContestsPage');

	useEffect(() => {
		const interval = setInterval(() => {
			setNow(new Date());
		}, 1000);
		return () => clearInterval(interval);
	}, []);

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

	function formatDuration(ms: number) {
		const totalSeconds = Math.floor(ms / 1000);
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;

		return `${hours}h ${minutes}m ${seconds}s`;
	}

	return (
		<div
			className="flex justify-between rounded-lg border p-4"
			key={contest.id}
		>
			<Link href={`/contests/${contest.id}`}>
				<h3 className="font-bold hover:underline">{contest.name}</h3>
				<p className="text-secondary text-sm">
					{getStatus(contest.start, contest.end)}
				</p>
				<p>
					{t('card.participants')}: {contest.userOnContest.length}
				</p>
			</Link>
		</div>
	);
}
