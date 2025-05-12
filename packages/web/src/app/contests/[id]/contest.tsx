"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import type { Contest } from "@runner/db";
import { Pencil, Trash } from "lucide-react";
import type { Session } from "next-auth";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function ContestPage({ id, session }: { id: string; session: Session }) {
	const router = useRouter();
	const utils = api.useUtils();

	const {
		data: contest,
		refetch: refetchContest,
		isLoading,
	} = api.contest.findById.useQuery(id);

	const { mutate: removeProblem } = api.contest.removeProblem.useMutation();

	const { mutate: deleteContest } = api.contest.delete.useMutation();

	if (isLoading) {
		return null;
	}

	if (!contest) {
		return <div>Contest not found</div>;
	}

	return (
		<div className="flex w-full flex-col items-center p-8">
			<div className="flex gap-2">
				<h1 className="font-bold text-4xl">{contest.name}</h1>

				<EditContest contest={contest} session={session} />
			</div>
			{new Intl.DateTimeFormat("en-US", {
				dateStyle: "medium",
				timeStyle: "short",
			}).format(contest.start)}

			<h2 className="mt-4 font-bold text-2xl">Problems</h2>

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
											refetchContest();
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
		</div>
	);
}

function EditContest({
	contest,
	session,
}: { contest: Contest; session: Session }) {
	if (contest.createdById !== session.user.id) {
		return null;
	}

	return (
		<div>
			<Link href={`${contest.id}/edit`}>
				<Pencil />
			</Link>
		</div>
	);
}
