'use client';

import { ProblemDescription } from '@/components/problems/description';
import { SubmissionList } from '@/components/problems/submissions';
import { UploadCode } from '@/components/problems/upload';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@/components/ui/resizable';
import { letters } from '@/lib/letters';
import type { Prisma, Problem } from '@prisma/client';
import * as RadioGroup from '@radix-ui/react-radio-group';
import type { Session } from 'next-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function ProblemTab({
	session,
	contest,
}: {
	session: Session;
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

	function isUserOnContest() {
		return contest.userOnContest.some(
			(userOnContest) => userOnContest.userId === session.user.id,
		);
	}

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

	if (contest.start > new Date()) {
		return (
			<div className="w-full flex items-center justify-center mt-10 font-bold text-xl">
				You cannot see the problems yet
			</div>
		);
	}

	if (contest.end > new Date()) {
		return (
			<div className="w-full flex items-center justify-center mt-10 font-bold text-xl">
				You will be able to see the contest problems after it finishes.
			</div>
		);
	}

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
					{isUserOnContest() && (
						<>
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
						</>
					)}
				</ResizablePanelGroup>
			)}
		</div>
	);
}
