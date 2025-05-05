import { DifficultyBadge } from "@/components/problems/diff-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ProblemsPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin?callbackUrl=/problems");
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
              <DifficultyBadge difficulty={problem.difficulty} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
