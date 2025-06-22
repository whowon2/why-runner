'use client';

import { ProblemDescription } from '@/components/problems/description';
import { SubmissionList } from '@/components/problems/submissions';
import { UploadCode } from '@/components/problems/upload';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/ui/resizable';
import type { Prisma, Problem } from '@prisma/client';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { useState } from 'react';

const letters = [
	'A',
	'B',
	'C',
	'D',
	'E',
	'F',
	'G',
	'H',
	'I',
	'J',
	'K',
	'L',
	'M',
	'N',
	'O',
	'P',
	'Q',
	'R',
	'S',
	'T',
	'U',
	'V',
	'W',
	'X',
	'Y',
	'Z',
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
		label: letters[idx],
		value: p.id,
	}));
	return (
		<div className="flex w-full gap-4">
			<RadioGroup.Root
				className="flex flex-col gap-2"
				onValueChange={handleSelectProblem}
			>
				{options.map((option) => (
					<RadioGroup.Item
						className="cursor-pointer rounded p-2 ring-[1px] ring-border transition-all duration-200 hover:bg-blue-300 data-[state=checked]:ring-2 data-[state=checked]:ring-blue-500"
						key={option.value}
						value={option.value}
					>
						<span className="font-semibold tracking-tight">{option.label}</span>
					</RadioGroup.Item>
				))}
			</RadioGroup.Root>
			{problem && (
				<ResizablePanelGroup direction="horizontal">
					<ResizablePanel className="p-2">
						<ProblemDescription problem={problem} />
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel className="p-2">
						<SubmissionList problem={problem} />
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel className="p-2">
						<UploadCode problem={problem} contest={contest} />
					</ResizablePanel>
				</ResizablePanelGroup>
			)}
		</div>
	);
}
