"use client";

import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { useEffect, useState } from "react";

export function ContestCard({
	contest,
}: {
	contest: Prisma.ContestGetPayload<{ include: { userOnContest: true } }>;
}) {
	const [now, setNow] = useState(new Date());

	useEffect(() => {
		const interval = setInterval(() => {
			setNow(new Date());
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	function getStatus(start: Date, end: Date) {
		if (now < start) {
			const diffMs = start.getTime() - now.getTime();
			return `Starts in: ${formatDuration(diffMs)}`;
		}

		if (start <= now && now <= end) {
			const diffMs = end.getTime() - now.getTime();
			return `Ends in: ${formatDuration(diffMs)}`;
		}

		return "FINISHED";
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
			key={contest.id}
			className="my-2 flex justify-between rounded-lg border p-4"
		>
			<Link href={`/contests/${contest.id}`}>
				<h3 className="font-bold hover:underline">{contest.name}</h3>
				<p className="text-blue-500 text-sm">
					{getStatus(contest.start, contest.end)}
				</p>
				<p>Participants: {contest.userOnContest.length}</p>
			</Link>
		</div>
	);
}
