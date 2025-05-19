"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Prisma, Problem } from "@prisma/client";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { ProblemDescription } from "../problems/description";
import { UploadCode } from "../problems/upload";
import { SubmissionList } from "../submissions/list";
import { Leaderboard } from "./leaderboard";

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

export default function ContestTabs({
	contest,
}: {
	contest: Prisma.ContestGetPayload<{
		include: {
			problems: true;
		};
	}>;
}) {
	const [problem, setProblem] = useState<Problem | null>(null);

	const options = contest.problems.map((p, idx) => ({
		value: p.id,
		label: letters[idx],
	}));

	function handleSelectProblem(value: string) {
		const prob = contest.problems.find((p) => p.id === value);

		if (prob) {
			setProblem(prob);
		}
	}

	return (
		<Tabs defaultValue="problems" className="w-full">
			<TabsList className="w-full justify-start rounded-none border-b bg-background p-0">
				<TabsTrigger
					className="h-full rounded-none border border-transparent border-b-[3px] bg-background data-[state=active]:border-primary data-[state=active]:shadow-none"
					value="problems"
				>
					Problems
				</TabsTrigger>
				<TabsTrigger
					className="h-full rounded-none border border-transparent border-b-[3px] bg-background data-[state=active]:border-primary data-[state=active]:shadow-none"
					value="leaderboard"
				>
					Leaderboard
				</TabsTrigger>
			</TabsList>
			<TabsContent value="problems" className="flex gap-4">
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
							<span className="font-semibold tracking-tight">
								{option.label}
							</span>
						</RadioGroup.Item>
					))}
				</RadioGroup.Root>
				{problem && (
					<div className="flex w-full flex-col gap-2">
						<ProblemDescription problem={problem} />
						<UploadCode problem={problem} />
						<SubmissionList problemId={problem.id} />
					</div>
				)}
			</TabsContent>
			<TabsContent value="leaderboard">
				<Leaderboard contest={contest} />
			</TabsContent>
		</Tabs>
	);
}
