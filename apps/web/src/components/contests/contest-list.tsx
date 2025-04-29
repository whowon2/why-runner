"use client";

import { api } from "@/trpc/react";
import { ContestCard } from "./contest-card";
import { ContestSkeletons } from "./contest-skeleton";
import { CreateContestDialog } from "./create/create-contest-dialog";

export function ContestList() {
	const { data: contests, refetch } = api.contest.find.useQuery({});

	return (
		<div className="flex flex-col p-8">
			<div className="flex justify-between">
				<h1 className="font-bold text-2xl">Contests</h1>
				<CreateContestDialog onCreate={refetch} />
			</div>

			{!contests && <ContestSkeletons />}

			{contests && contests.length === 0 && (
				<div className="flex h-32 items-center justify-center">
					<p className="text-gray-500">No contests found</p>
				</div>
			)}

			{contests && (
				<div>
					{contests.map((contest) => (
						<ContestCard
							key={contest.id}
							contest={contest}
							refetchAction={refetch}
						/>
					))}
				</div>
			)}
		</div>
	);
}
