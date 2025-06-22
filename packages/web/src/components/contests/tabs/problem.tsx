'use client';

import type { Prisma, Problem } from '@prisma/client';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProblemDescription } from '@/components/problems/description';
import { SubmissionList } from '@/components/problems/submissions';
import { UploadCode } from '@/components/problems/upload';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@/components/ui/resizable';
import { letters } from '@/lib/letters';

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
	const router = useRouter();
	const searchParams = useSearchParams();

	const [problem, setProblem] = useState<Problem | null>();

	function handleSelectProblem(value: string) {
		const prob = contest.problems.find((p) => p.id === value);
		if (prob) {
			setProblem(prob);
			const params = new URLSearchParams(searchParams);
			params.set('problem', value);
			router.replace(`?${params.toString()}`, { scroll: false });
		}
	}

	const options = contest.problems.map((p, idx) => ({
		label: letters[idx],
		value: p.id,
	}));

	// On mount, check if URL has problem selected
	useEffect(() => {
		const problemId = searchParams.get('problem');
		if (problemId) {
			const prob = contest.problems.find((p) => p.id === problemId);
			if (prob) {
				setProblem(prob);
			}
		}
	}, [searchParams, contest.problems]);

	return (
		<div className="flex flex-col w-full gap-4">
			<RadioGroup.Root
				className="flex flex-wrap gap-2"
				onValueChange={handleSelectProblem}
				value={problem?.id ?? ''}
			>
				{options.map((option) => (
					<RadioGroup.Item
						className="cursor-pointer rounded px-4 py-2 ring-[1px] ring-border transition-all duration-200 hover:bg-blue-600 data-[state=checked]:ring-2 data-[state=checked]:ring-blue-500"
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
						<UploadCode
							contest={contest}
							problem={problem}
							problemLetter={
								letters[
									contest.problems.findIndex((p) => p.id === problem.id)
								] ?? ''
							}
						/>
					</ResizablePanel>
				</ResizablePanelGroup>
			)}
		</div>
	);
}
