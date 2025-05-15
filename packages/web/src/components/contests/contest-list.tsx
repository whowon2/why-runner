"use client";

import type { Contest, Prisma } from "@runner/db";
import type { Session } from "next-auth";
import { ContestCard } from "./contest-card";
import { ContestSkeletons } from "./contest-skeleton";
import { CreateContestDialog } from "./create/create-contest-dialog";

export function ContestList({
	contests,
	session,
}: {
	contests: Prisma.ContestGetPayload<{ include: { UserOnContest: true } }>[];
	session: Session;
}) {
	return (
		<div className="flex w-full max-w-7xl flex-col">
			<div className="flex justify-between">
				<h1 className="font-bold text-2xl">Contests</h1>
				<CreateContestDialog />
			</div>

			{contests && contests.length === 0 && (
				<div className="flex h-32 items-center justify-center">
					<p className="text-gray-500">No contests found</p>
				</div>
			)}

			<div>
				{contests.map((contest) => (
					<ContestCard key={contest.id} contest={contest} />
				))}
			</div>
		</div>
	);
}
