'use client';

import type { Prisma, Problem } from '@prisma/client';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { useSearchParams } from 'next/navigation';
import type { Session } from 'next-auth';
import { Fragment, useEffect, useState } from 'react';
import { ProblemDescription } from '@/components/problems/description';
import { SubmissionList } from '@/components/problems/submissions';
import { UploadCode } from '@/components/problems/upload';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@/components/ui/resizable';
import { useRouter } from '@/i18n/navigation';
import { letters } from '@/lib/letters';
import { cn } from '@/lib/utils';

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

	const [problem, setProblem] = useState<Problem | null>(null);
	// 1. Add state to track if the contest has started
	const [isContestStarted, setIsContestStarted] = useState(
		() => new Date() >= contest.start,
	);

	const isUserOnContest = contest.userOnContest.find(
		(userOnContest) => userOnContest.userId === session.user.id,
	);

	const questionsAnswered = isUserOnContest?.answers ?? [];

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

	// 2. This effect checks the time and updates the state to trigger a re-render
	useEffect(() => {
		if (isContestStarted) {
			return;
		}

		const interval = setInterval(() => {
			if (new Date() >= contest.start) {
				setIsContestStarted(true);
				clearInterval(interval); // 5. Cleanup the interval
			}
		}, 1000);

		return () => clearInterval(interval); // Cleanup on unmount
	}, [isContestStarted, contest.start]);

	// 3. Use the state for conditional rendering
	if (!isContestStarted) {
		return (
			<div className="w-full flex items-center justify-center mt-10 font-bold text-xl">
				Você ainda não pode ver os problemas.
			</div>
		);
	}

	if (contest.end > new Date() && !isUserOnContest) {
		return (
			<div className="w-full flex items-center justify-center mt-10 font-bold text-xl">
				Você poderá ver os problemas após o término do torneio.
			</div>
		);
	}

	// if (!problem) {
	// 	return (
	// 		<div className="w-full flex items-center justify-center mt-10 font-bold text-xl">
	// 			Você ainda não pode ver os problemas.
	// 		</div>
	// 	);
	// }

	return (
		<div className="flex flex-col w-full gap-4">
			<RadioGroup.Root
				className="flex flex-wrap gap-2"
				onValueChange={handleSelectProblem}
				value={problem?.id ?? ''}
			>
				{options.map((option) => (
					<RadioGroup.Item
						className={cn(
							'cursor-pointer rounded px-4 py-2 ring-[1px] ring-border transition-all duration-200 hover:bg-secondary data-[state=checked]:ring-2 data-[state=checked]:ring-secondary',
							{
								'bg-green-500 text-primary-foreground': questionsAnswered.some(
									(answer) => answer === option.label,
								),
							},
						)}
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
					{isUserOnContest && (
						<>
							<ResizableHandle withHandle />
							<ResizablePanel className="p-2">
								<SubmissionList problem={problem} />
							</ResizablePanel>
							{contest.end > new Date() && (
								<Fragment>
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
								</Fragment>
							)}
						</>
					)}
				</ResizablePanelGroup>
			)}
		</div>
	);
}
