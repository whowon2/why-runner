"use client";

import { api } from "@/trpc/react";
import { ContestCard } from "./card";
import { CreateContestDialog } from "./create/dialog";

export function ContestList() {
	const [contests] = api.contest.findAll.useSuspenseQuery();

	return (
		<div className="w-full max-w-7xl">
			<div className="flex justify-between">
				<h1 className="font-bold text-2xl">Contests</h1>
				<CreateContestDialog />
			</div>

			{contests && contests.length === 0 && (
				<div className="flex h-32 items-center justify-center">
					<p className="text-gray-500">No contests found</p>
				</div>
			)}

			<div className="flex flex-col gap-4 py-4">
				{contests.map((contest) => (
					<ContestCard key={contest.id} contest={contest} />
				))}
			</div>
		</div>
	);
}
