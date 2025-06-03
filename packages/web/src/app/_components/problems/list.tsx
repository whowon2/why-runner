"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import Link from "next/link";
import { DifficultyBadge } from "./badge";

export function ProblemsList() {
	const [problems] = api.problem.getAll.useSuspenseQuery({});

	return (
		<div className="w-full max-w-7xl">
			<div className="flex justify-between">
				<h1 className="font-bold text-2xl">Problems</h1>
				<Link href={"/problems/new"}>
					<Button variant={"outline"}>New Problem</Button>
				</Link>
			</div>
			<div>
				{problems.map((problem) => (
					<Link href={`/problems/${problem.id}`} key={problem.id}>
						<div
							key={problem.id}
							className="my-2 flex justify-between rounded-lg border p-4"
						>
							<h3 className="font-bold">{problem.title}</h3>
							<DifficultyBadge difficulty={problem.difficulty} />
						</div>
					</Link>
				))}
			</div>
		</div>
	);
}
