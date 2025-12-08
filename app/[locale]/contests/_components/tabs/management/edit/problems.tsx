"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Contest, Problem, ProblemOnContest } from "@/drizzle/schema";
import { useAddProblemToContest } from "@/hooks/use-add-problem";
import { useProblems } from "@/hooks/use-problems";
import { useRemoveProblemToContest as useRemoveProblemFromContest } from "@/hooks/use-remove-problem";
import { Link, usePathname } from "@/i18n/navigation";

export function EditContestProblems({
  contest,
}: {
  contest: Contest & {
    problems: ProblemOnContest[];
  };
}) {
  console.log("mount");
  const { data: problems } = useProblems();

  const { mutate: addProblem, isPending: isAddPending } =
    useAddProblemToContest();

  const queryClient = useQueryClient();

  const pathname = usePathname();

  function handleProblemSelect(id: string) {
    addProblem(
      { contestId: contest.id, problemId: Number(id) },
      {
        onError(error) {
          toast.error("Failed to add problem", {
            description: error.message,
          });
        },
        onSuccess() {
          toast.success("Problem added");
          queryClient.invalidateQueries({
            queryKey: ["contest", String(contest.id)],
          });
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
          value={""}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Problem" />
          </SelectTrigger>
          <SelectContent>
            {problems
              ?.filter(
                (p) =>
                  !contest.problems.find(
                    (probOnCont) => probOnCont.problemId === p.id,
                  ),
              )
              .map((p) => (
                <SelectItem className="w-full" key={p.id} value={String(p.id)}>
                  {p.title}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Link href={`/problems/new?callback=${pathname}`}>
          <Button type="button">Create</Button>
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        {contest.problems.map((probOnCont) => (
          <div
            className="flex items-center justify-between rounded border p-2"
            key={probOnCont.problemId}
          >
            <p>{probOnCont.problem.title}</p>
            <RemoveProblemButton
              contest={contest}
              problem={probOnCont.problem}
            />
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
    useRemoveProblemFromContest();
  const queryClient = useQueryClient();

  function handleRemoveProblem(id: number) {
    removeProblem(
      { contestId: contest.id, problemId: id },
      {
        onError(error) {
          toast.error("Failed to remove problem", {
            description: error.message,
          });
        },
        onSuccess() {
          toast.success("Problem removed");
          queryClient.invalidateQueries({
            queryKey: ["contest", String(contest.id)],
          });
        },
      },
    );
  }

  return (
    <Button
      disabled={isRemovePending}
      onClick={() => handleRemoveProblem(problem.id)}
      variant={"outline"}
    >
      {isRemovePending ? <Loader className="animate-spin" /> : <X />}
    </Button>
  );
}
