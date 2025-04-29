import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/server";
import Link from "next/link";

export default async function ProblemsPage() {
	function badgeColor(difficulty: string) {
		switch (difficulty) {
			case "easy":
				return "bg-green-400";
			case "medium":
				return "bg-orange-400";
			case "hard":
				return "bg-red-400";
			default:
				return "bg-gray-400";
		}
	}

	const problems = await api.problem.getAll({});

	return (
		<div className="flex flex-col p-8">
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
							<Badge className={`text-white ${badgeColor(problem.difficulty)}`}>
								{problem.difficulty}
							</Badge>
						</div>
					</Link>
				))}
			</div>
		</div>
	);
}
