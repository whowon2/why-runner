"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { Trash } from "lucide-react";
import type { Session } from "next-auth";
import { useRouter } from "next/navigation";
import { AddProblemDialog } from "./add-problem-dialog";

export function Contest({ id, session }: { id: string; session: Session }) {
	const router = useRouter();
	const utils = api.useUtils();

	const { data: contest, refetch: refetchContest } =
		api.contest.findOne.useQuery(id);
	const { mutate: removeProblem } = api.contest.removeProblem.useMutation();

	const { mutate: publishContest } = api.contest.publish.useMutation();

	const { mutate: deleteContest } = api.contest.delete.useMutation();

	if (!contest) {
		return <div>Contest not found</div>;
	}

	if (
		contest.status === "UNPUBLISHED" &&
		contest.createdById !== session.user.id
	) {
		return <div>Contest is unpublished</div>;
	}

	if (contest.createdById !== session.user.id) {
		return <div>You are not the creator of this contest</div>;
	}

	return (
		<div className="flex w-full flex-col items-center p-8">
			<h1 className="font-bold text-4xl">{contest.name}</h1>
			{new Intl.DateTimeFormat("en-US", {
				dateStyle: "medium",
				timeStyle: "short",
			}).format(contest.startDate)}

			{contest.status === "UNPUBLISHED" && (
				<div>
					<Button
						onClick={() =>
							publishContest(
								{ contestId: contest.id },
								{
									onSuccess: () => {
										refetchContest();
									},
								},
							)
						}
					>
						Publish
					</Button>

					<Button
						variant={"destructive"}
						onClick={() =>
							deleteContest(
								{ contestId: contest.id },
								{
									onSuccess: () => {
										utils.contest.find.invalidate();
										router.push("/contests");
									},
								},
							)
						}
					>
						Cancel
					</Button>
				</div>
			)}

			<h2 className="mt-4 font-bold text-2xl">Problems</h2>
			<AddProblemDialog refetchContest={refetchContest} contest={contest} />
			<div className="mt-4 flex flex-col items-center justify-center">
				{contest.problems.map((problem, idx) => (
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
				{contest.problems.length === 0 && <div>No problems yet</div>}
			</div>
		</div>
	);
}
