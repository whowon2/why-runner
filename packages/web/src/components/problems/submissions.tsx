'use client';

import type { Problem, SubmissionStatus } from '@prisma/client';
import { RefreshCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/trpc/react';
import { AIDialog } from './ai/dialog';

const color = (status: SubmissionStatus) => {
	switch (status) {
		case 'ERROR':
			return 'border-destructive';
		case 'FAILED':
			return 'border-destructive';
		case 'PASSED':
			return 'border-green-400';
		case 'RUNNING':
			return 'border-blue-400';
		default:
			return 'border-card-400';
	}
};

export function SubmissionList({ problem }: { problem: Problem }) {
	const t = useTranslations('ContestsPage.Tabs.Problem.Submissions');
	const {
		data: submissions,
		isPending,
		refetch: refetchSubmissions,
	} = api.submission.find.useQuery(
		{
			problemId: problem.id,
		},
		{ refetchInterval: 5000 },
	);

	if (isPending) {
		return <Skeleton className="h-20 w-full" />;
	}

	if (!submissions) {
		return <div>No submissions!</div>;
	}

	return (
		<Card className="max-h-screen w-full overflow-auto border-none bg-transparent shadow-none">
			<CardHeader>
				<CardTitle
					className="flex justify-between flex-wrap gap-2"
					onClick={() => refetchSubmissions()}
				>
					<h1>
						{t('title')} ({submissions.length})
					</h1>
					<Button>
						<RefreshCcw />
					</Button>
				</CardTitle>
			</CardHeader>
			<CardContent className="">
				<Accordion className="w-full space-y-2" collapsible type="single">
					{submissions.map((submission) => (
						<AccordionItem
							className={`rounded-md border px-4 last:border flex-wrap ${color(submission.status)}`}
							key={submission.id}
							value={`item-${submission.id}`}
						>
							<AccordionTrigger className="flex-wrap overflow-hidden">
								<p className="flex-1 text-gray-500 text-sm">
									{submission.createdAt.toLocaleTimeString()}:
								</p>
								<p className="text-xs">
									{submission.status ?? 'Processing...'}
								</p>
							</AccordionTrigger>
							<AccordionContent className="flex justify-between">
								{submission.output && (
									<SubmissionDetails output={submission.output} />
								)}
								{['PASSED', 'FAILED', 'ERROR'].includes(submission.status) && (
									<AIDialog problem={problem} submission={submission} />
								)}
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</CardContent>
		</Card>
	);
}

function SubmissionDetails({ output }: { output: string }) {
	console.log(output);
	console.log(JSON.parse(output));

	const details: {
		passed: boolean;
		tests: string[];
		error: string;
	} = JSON.parse(output);

	return (
		<div>
			{details.tests?.map((t, idx) => (
				<div key={idx}>
					Test {idx}: {t}
				</div>
			))}
			{details.error}
		</div>
	);
}
