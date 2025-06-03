"use client";

import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";
import type { Prisma } from "@prisma/client";
import { TRPCClientError } from "@trpc/client";
import { X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

export function EditContestProblems({
	contest,
}: {
	contest: Prisma.ContestGetPayload<{
		include: {
			problems: true;
		};
	}>;
}) {
	const { data: problems, refetch } = api.problem.getAll.useQuery({});
	const { mutate: addProblem } = api.contest.addProblems.useMutation();
	const { mutate: removeProblem } = api.contest.removeProblem.useMutation();

	const router = useRouter();
	const pathname = usePathname();

	function handleProblemSelect(id: string) {
		addProblem(
			{ contestId: contest.id, problemId: id },
			{
				onSuccess() {
					toast.success("Problem added");
					router.refresh();
				},
				onError(error) {
					if (error instanceof TRPCClientError) {
						toast.error("Failed to add problem", {
							description: error.message,
						});
					} else {
						toast.error("Unexpected error", {
							description: "Something went wrong.",
						});
					}
				},
			},
		);
	}

	function handleRemoveProblem(id: string) {
		removeProblem(
			{ contestId: contest.id, problemId: id },
			{
				onSuccess() {
					toast.success("Problem removed");
					router.refresh();
				},
				onError(error) {
					if (error instanceof TRPCClientError) {
						toast.error("Failed to remove problem", {
							description: error.message,
						});
					} else {
						toast.error("Unexpected error", {
							description: "Something went wrong.",
						});
					}
				},
			},
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="flex w-full gap-2">
				<Select value={""} onValueChange={handleProblemSelect}>
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
						key={p.id}
						className="flex items-center justify-between rounded border p-2"
					>
						<p>{p.title}</p>
						<Button
							variant={"outline"}
							onClick={() => handleRemoveProblem(p.id)}
						>
							<X />
						</Button>
					</div>
				))}
			</div>
		</div>
	);
}
