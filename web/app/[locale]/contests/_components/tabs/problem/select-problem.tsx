import * as RadioGroup from "@radix-ui/react-radio-group";
import type { User } from "better-auth";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import type {
  Contest,
  ProblemOnContest,
  ProblemPreview,
  UserOnContest,
} from "@/drizzle/schema";
import { useRouter } from "@/i18n/navigation";
import { letters } from "@/lib/letters";
import { cn } from "@/lib/utils";

export function SelectProblem({
  contest,
  setProblem,
  user: _user,
  answered,
}: {
  contest: Contest & {
    problems: ProblemOnContest[];
    users: UserOnContest[];
  };
  setProblem: (problem: ProblemPreview) => void;
  user: User;
  answered: string[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const options = contest.problems.map((p, idx) => ({
    label: letters[idx],
    value: p.problemId,
  }));

  const selectedSlug = searchParams.get("problem");
  const selectedProblem = selectedSlug
    ? contest.problems.find((p) => p.problem.slug === selectedSlug)
    : undefined;

  function handleSelectProblem(value: string) {
    const prob = contest.problems.find((p) => p.problemId === value);
    if (prob) {
      setProblem(prob.problem);
      const params = new URLSearchParams(searchParams);
      params.set("problem", prob.problem.slug);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }

  useEffect(() => {
    if (selectedProblem) {
      setProblem(selectedProblem.problem);
    }
  }, [selectedProblem, setProblem]);

  return (
    <RadioGroup.Root
      className="flex flex-wrap gap-2"
      value={selectedProblem?.problemId}
      onValueChange={handleSelectProblem}
    >
      {options.map((option) => {
        const isAnswered = answered.includes(option.label);

        return (
          <RadioGroup.Item
            className={cn(
              "cursor-pointer rounded-none min-w-[60px] border border-border bg-background px-4 py-2 text-foreground transition-colors duration-200 data-[state=unchecked]:hover:border-primary data-[state=unchecked]:hover:bg-primary/10",
              "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
              {
                "border-green-600/50 bg-green-500/15 text-green-700 dark:text-green-400 data-[state=checked]:border-green-600 data-[state=checked]:bg-green-600 data-[state=checked]:text-white":
                  isAnswered,
              },
            )}
            key={option.value}
            value={String(option.value)}
          >
            <div className="flex flex-col items-center justify-center">
              <span className="font-bold text-lg">{option.label}</span>
            </div>
          </RadioGroup.Item>
        );
      })}
    </RadioGroup.Root>
  );
}
