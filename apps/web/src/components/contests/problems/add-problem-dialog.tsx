"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";
import type { Prisma, Problem } from "@prisma/client";
import { useState } from "react";

export function AddProblemDialog({
	contest,
	refetchContest,
}: {
	contest: Prisma.ContestGetPayload<{
		include: { problems: true };
	}>;
	refetchContest: () => void;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedProblems, setSelectedProblems] = useState<Problem[]>([]);
	const { data: problems, isLoading } = api.problem.getAll.useQuery({});
	const { mutate: addProblems } = api.contest.addProblems.useMutation();

	function handleSelectChange(value: string) {
		if (!problems) {
			return;
		}

		const problem = problems.find((p) => p.title === value);

		if (!problem) {
			return;
		}

		const isProblemAlreadySelected = selectedProblems.some(
			(selectedProblem) => selectedProblem.id === problem.id,
		);

		if (isProblemAlreadySelected) {
			return;
		}

		setSelectedProblems([...selectedProblems, problem]);
	}

	if (isLoading || !problems) {
		return <div>Loading...</div>;
	}

	const problemsNotInContest = problems.filter(
		(problem) =>
			!contest.problems.some(
				(contestProblem) => contestProblem.id === problem.id,
			) ||
			selectedProblems.some(
				(selectedProblem) => selectedProblem.id === problem.id,
			),
	);

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) {
					setSelectedProblems([]); // Clear selected problems when closing
				}
				setIsOpen(open);
			}}
		>
			<DialogTrigger asChild>
				<Button variant="outline">Add problems</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Add Problem</DialogTitle>
				</DialogHeader>
				<Select onValueChange={handleSelectChange}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Select a problem" />
					</SelectTrigger>
					<SelectContent>
						{problemsNotInContest.length === 0 && <div>No problems to add</div>}
						{problemsNotInContest.map((problem) => (
							<SelectItem value={problem.title} key={problem.id}>
								{problem.title}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{selectedProblems.map((problem) => (
					<div key={problem.id}>{problem.title}</div>
				))}
				<Button
					disabled={selectedProblems.length === 0}
					onClick={() =>
						addProblems(
							{
								contestId: contest.id,
								problemsIds: selectedProblems.map((problem) => problem.id),
							},
							{
								onSuccess: () => {
									setIsOpen(false);
									refetchContest();
									setSelectedProblems([]);
								},
							},
						)
					}
				>
					Add
				</Button>
			</DialogContent>
		</Dialog>
	);
}
