"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import type { Contest } from "@runner/db";
import { useRouter } from "next/navigation";

export function DeleteContestDialog({ contest }: { contest: Contest }) {
	const router = useRouter();
	const utils = api.useUtils();

	const { mutate: deleteContest, isPending } = api.contest.delete.useMutation();

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild={true}>
				<Button variant="destructive">Delete Contest</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently delete your
						contest.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => {
							deleteContest(
								{ contestId: contest.id },
								{
									onSuccess: () => {
										utils.contest.findAll.invalidate();
										router.push("/contests");
									},
								},
							);
						}}
						disabled={isPending}
					>
						{isPending ? "Deleting..." : "Delete"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
