'use client';

import type { Problem, Submission } from '@prisma/client';
import { Brain } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { api } from '@/trpc/react';

export function AIDialog({
	submission,
	problem,
}: {
	submission: Submission;
	problem: Problem;
}) {
	const { mutate } = api.submission.getAiHelp.useMutation();
	const [help, setHelp] = useState('');

	function handle() {
		mutate(
			{ problem, submission },
			{
				onError: (e) => {
					console.log('error', e);
				},
				onSuccess: (data) => {
					console.log('success', data);
					setHelp(data ?? 'No response!');
				},
			},
		);
	}

	return (
		<Dialog>
			<form>
				<DialogTrigger asChild>
					<Button variant={'outline'}>
						<Brain />
					</Button>
				</DialogTrigger>
				<DialogContent className="">
					<DialogHeader>
						<DialogTitle>Get AI Help</DialogTitle>
					</DialogHeader>
					{help}
					<DialogFooter>
						<DialogClose asChild>
							<Button variant="outline">Cancel</Button>
						</DialogClose>
						<Button onClick={handle} type="submit">
							Request
						</Button>
					</DialogFooter>
				</DialogContent>
			</form>
		</Dialog>
	);
}
