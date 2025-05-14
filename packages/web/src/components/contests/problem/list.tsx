"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import type { Contest, Prisma } from "@runner/db";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";

export function ContestProblemList({
	contest,
}: { contest: Prisma.ContestGetPayload<{ include: { Problems: true } }> }) {
	const router = useRouter();
	const utils = api.useUtils();

	const { mutate: removeProblem } = api.contest.removeProblem.useMutation();

	const { mutate: deleteContest } = api.contest.delete.useMutation();

	return (
		<div className="mt-4 flex flex-col items-center justify-center">
			{contest.Problems.map((problem, idx) => (
				<div
					key={problem.id}
					className="mt-4 flex w-full items-center justify-between gap-16"
				>
					<div>{idx + 1}</div>
					<div className="">{problem.title}</div>
					<div>{problem.difficulty}</div>
					<Button
						variant={"ghost"}
						onClick={() => {
							removeProblem(
								{ contestId: contest.id, problemId: problem.id },
								{
									onSuccess: () => {
										utils.contest.findById.invalidate();
									},
								},
							);
						}}
					>
						<Trash />
					</Button>
				</div>
			))}
			{contest.Problems.length === 0 && <div>No problems yet</div>}
		</div>
	);
}
