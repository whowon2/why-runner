import { DifficultyBadge } from "@/components/problems/diff-badge";
import { Button } from "@/components/ui/button";
import type { Problem } from "@runner/db";
import Link from "next/link";

export function ProblemsList({ problems }: { problems: Problem[] }) {
	return (
		<div>
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
