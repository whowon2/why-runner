"use client";

import { ProblemDescription } from "@/app/_components/problems/description";
import { UploadCode } from "@/app/_components/problems/upload";
import { SubmissionList } from "@/app/_components/submissions/list";
import type { Prisma, Problem } from "@prisma/client";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { useState } from "react";

const letters = [
	"A",
	"B",
	"C",
	"D",
	"E",
	"F",
	"G",
	"H",
	"I",
	"J",
	"K",
	"L",
	"M",
	"N",
	"O",
	"P",
	"Q",
	"R",
	"S",
	"T",
	"U",
	"V",
	"W",
	"X",
	"Y",
	"Z",
];

export function SelectProblem({
	contest,
}: {
	contest: Prisma.ContestGetPayload<{
		include: {
			problems: true;
			userOnContest: true;
		};
	}>;
}) {
	const [problem, setProblem] = useState<Problem | null>(null);

	function handleSelectProblem(value: string) {
		const prob = contest.problems.find((p) => p.id === value);

		if (prob) {
			setProblem(prob);
		}
	}

	const options = contest.problems.map((p, idx) => ({
		value: p.id,
		label: letters[idx],
	}));
	return (
		<>
			<RadioGroup.Root
				onValueChange={handleSelectProblem}
				className="flex flex-col gap-2"
			>
				{options.map((option) => (
					<RadioGroup.Item
						key={option.value}
						value={option.value}
						className="cursor-pointer rounded p-2 ring-[1px] ring-border transition-all duration-200 hover:bg-blue-300 data-[state=checked]:ring-2 data-[state=checked]:ring-blue-500"
					>
						<span className="font-semibold tracking-tight">{option.label}</span>
					</RadioGroup.Item>
				))}
			</RadioGroup.Root>
			{problem && (
				<div className="flex w-full flex-col gap-2">
					<ProblemDescription problem={problem} />
					<UploadCode problem={problem} />
					<SubmissionList problem={problem} />
				</div>
			)}
		</>
	);
}
