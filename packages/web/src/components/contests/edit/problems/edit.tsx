'use client';

import type { Contest, Prisma, Problem } from '@prisma/client';
import { TRPCClientError } from '@trpc/client';
import { Loader, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { api } from '@/trpc/react';

export function EditContestProblems({
	contest,
}: {
	contest: Prisma.ContestGetPayload<{
		include: {
			problems: true;
		};
	}>;
}) {
	const { data: problems } = api.problem.getAll.useQuery({});
	const { mutate: addProblem, isPending: isAddPending } =
		api.contest.addProblems.useMutation();

	const router = useRouter();
	const pathname = usePathname();

	function handleProblemSelect(id: string) {
		addProblem(
			{ contestId: contest.id, problemId: id },
			{
				onError(error) {
					if (error instanceof TRPCClientError) {
						toast.error('Failed to add problem', {
							description: error.message,
						});
					} else {
						toast.error('Unexpected error', {
							description: 'Something went wrong.',
						});
					}
				},
				onSuccess() {
					toast.success('Problem added');
					router.refresh();
				},
			},
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="flex w-full gap-2">
				<Select
					disabled={isAddPending}
					onValueChange={handleProblemSelect}
					value={''}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Problem" />
					</SelectTrigger>
					<SelectContent>
						{problems
							?.filter((p) => !contest.problems.find((cp) => cp.id === p.id))
							.map((p) => (
								<SelectItem className="w-full" key={p.id} value={p.id}>
									{p.title}
								</SelectItem>
							))}
					</SelectContent>
				</Select>
				<Link href={`/problems/new?callback=${pathname}`}>
					<Button className="cursor-pointer" type="button">
						Create
					</Button>
				</Link>
			</div>
			<div className="flex flex-col gap-2">
				{contest.problems.map((p) => (
					<div
						className="flex items-center justify-between rounded border p-2"
						key={p.id}
					>
						<p>{p.title}</p>
						<RemoveProblemButton contest={contest} problem={p} />
					</div>
				))}
			</div>
		</div>
	);
}

function RemoveProblemButton({
	problem,
	contest,
}: {
	problem: Problem;
	contest: Contest;
}) {
	const { mutate: removeProblem, isPending: isRemovePending } =
		api.contest.removeProblem.useMutation();
	const router = useRouter();

	function handleRemoveProblem(id: string) {
		removeProblem(
			{ contestId: contest.id, problemId: id },
			{
				onError(error) {
					if (error instanceof TRPCClientError) {
						toast.error('Failed to remove problem', {
							description: error.message,
						});
					} else {
						toast.error('Unexpected error', {
							description: 'Something went wrong.',
						});
					}
				},
				onSuccess() {
					toast.success('Problem removed');
					router.refresh();
				},
			},
		);
	}

	return (
		<Button
			disabled={isRemovePending}
			onClick={() => handleRemoveProblem(problem.id)}
			variant={'outline'}
		>
			{isRemovePending ? <Loader className="animate-spin" /> : <X />}
		</Button>
	);
}
