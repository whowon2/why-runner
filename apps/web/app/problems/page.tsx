import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { problemsService } from "@/lib/problems/service";
import Link from "next/link";
import { DifficultyBadge } from "@/components/problems/difficulty-badge";

export default async function ProblemsPage() {
	const problems = await problemsService.getAll();

	return (
		<div className="flex flex-col p-8">
			<div className="flex justify-between">
				<h1 className="text-2xl font-bold">Problems</h1>
				<Link href={"/problems/new"}>
					<Button variant={"outline"}>New Problem</Button>
				</Link>
			</div>
			<div>
				{problems.map((problem) => (
					<Link href={`/problems/${problem.id}`} key={problem.id}>
						<div
							key={problem.id}
							className="my-2 rounded-lg border p-4 flex justify-between"
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
