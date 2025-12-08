import * as RadioGroup from "@radix-ui/react-radio-group";
import type { User } from "better-auth";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import {
  type Contest,
  type Problem,
  type ProblemOnContest,
  problem,
  type UserOnContest,
} from "@/drizzle/schema";
import { useRouter } from "@/i18n/navigation";
import { letters } from "@/lib/letters";
import { cn, isProblemSolved } from "@/lib/utils";

export function SelectProblem({
  contest,
  setProblem,
  user,
  solved,
}: {
  contest: Contest & {
    problems: ProblemOnContest[];
    users: UserOnContest[];
  };
  setProblem: (problem: Problem) => void;
  user: User;
  solved: Problem[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const options = contest.problems.map((p, idx) => ({
    label: letters[idx],
    value: p.problemId,
  }));

  function handleSelectProblem(value: string) {
    const prob = contest.problems.find((p) => p.problemId === Number(value));
    if (prob) {
      setProblem(prob.problem);
      const params = new URLSearchParams(searchParams);
      params.set("problem", value.toString());
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }

  useEffect(() => {
    const problemId = searchParams.get("problem");
    if (problemId) {
      const prob = contest.problems.find(
        (p) => p.problemId === Number(problemId),
      );
      if (prob) {
        setProblem(prob.problem);
      }
    }
  }, [searchParams, contest.problems, setProblem]);

  return (
    <RadioGroup.Root
      className="flex flex-wrap gap-2"
      onValueChange={handleSelectProblem}
      value={String(problem?.id) ?? ""}
    >
      {options.map((option) => (
        <RadioGroup.Item
          className={cn(
            "cursor-pointer rounded px-4 py-2 ring-[1px] ring-border transition-all duration-200 hover:bg-secondary data-[state=checked]:ring-2 data-[state=checked]:ring-secondary",
            {
              "bg-green-500 text-primary-foreground": isProblemSolved(
                option.value,
                solved,
              ),
            },
          )}
          key={option.value}
          value={String(option.value)}
        >
          <span className="font-semibold tracking-tight">{option.label}</span>
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
