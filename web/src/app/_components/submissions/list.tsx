"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";
import type { Problem, SubmissionStatus } from "@prisma/client";
import { RefreshCcw } from "lucide-react";

const color = (status: SubmissionStatus) => {
	switch (status) {
		case "ERROR":
			return "border-destructive";
		case "FAILED":
			return "border-destructive";
		case "PASSED":
			return "border-green-400";
		case "RUNNING":
			return "border-blue-400";
		default:
			return "border-card-400";
	}
};

export function SubmissionList({ problem }: { problem: Problem }) {
	const {
		data: submissions,
		isPending,
		refetch: refetchSubmissions,
	} = api.submission.find.useQuery({
		problemId: problem.id,
	});

	if (isPending) {
		return <Skeleton className="h-20 w-full" />;
	}

	if (!submissions) {
		return <div>No submissions!</div>;
	}

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle
					className="flex justify-between"
					onClick={() => refetchSubmissions()}
				>
					<h1>Submissions</h1>
					<Button>
						<RefreshCcw />
					</Button>
				</CardTitle>
			</CardHeader>
			<CardContent className="">
				<Accordion type="single" collapsible className="w-full space-y-2">
					{submissions.map((submission) => (
						<AccordionItem
							value={`item-${submission.id}`}
							key={submission.id}
							className={`rounded-md border px-4 last:border ${color(submission.status)}`}
						>
							<AccordionTrigger>
								<p className="w-full text-gray-500 text-sm">
									{submission.createdAt.toLocaleTimeString()}:
								</p>
								<p className="text-xs">
									{submission.status ?? "Processing..."}
								</p>
							</AccordionTrigger>
							<AccordionContent>
								{submission.output && (
									<SubmissionDetails output={submission.output} />
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
	console.log(JSON.parse(output));

	const details: {
		passed: boolean;
		tests: string[];
	} = JSON.parse(output);

	return (
		<div>
			{details.tests?.map((t, idx) => (
				<div key={idx}>
					Test {idx}: {t}
				</div>
			))}
		</div>
	);
}
