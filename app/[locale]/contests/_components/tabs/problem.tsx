"use client";

import * as RadioGroup from "@radix-ui/react-radio-group";
import type { Session } from "better-auth";
import { useSearchParams } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useRouter } from "@/i18n/navigation";
import type {
  Contest,
  Problem,
  ProblemOnContest,
  UserOnContest,
} from "@/lib/db/schema";
import { letters } from "@/lib/letters";
import { cn } from "@/lib/utils";

export function ProblemTab({
  session,
  contest,
}: {
  session: Session;
  contest: Contest & {
    problems: ProblemOnContest[];
    users: UserOnContest[];
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [problem, setProblem] = useState<Problem | null>(null);
  // 1. Add state to track if the contest has started
  const [isContestStarted, setIsContestStarted] = useState(
    () => new Date() >= contest.startDate,
  );

  const isUserOnContest = contest.users.find(
    (userOnContest) => userOnContest.userId === session.userId,
  );

  const questionsAnswered = isUserOnContest?.answered ?? [];

  function handleSelectProblem(value: string) {
    const prob = contest.problems.find((p) => p.problemId === Number(value));
    if (prob) {
      setProblem(prob.problem);
      const params = new URLSearchParams(searchParams);
      params.set("problem", value.toString());
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }

  const options = contest.problems.map((p, idx) => ({
    label: letters[idx],
    value: p.problemId,
  }));

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
  }, [searchParams, contest.problems]);

  useEffect(() => {
    if (isContestStarted) {
      return;
    }

    const interval = setInterval(() => {
      if (new Date() >= contest.startDate) {
        setIsContestStarted(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isContestStarted, contest.startDate]);

  if (!isContestStarted) {
    return (
      <div className="w-full flex items-center justify-center mt-10 font-bold text-xl">
        Você ainda não pode ver os problemas.
      </div>
    );
  }

  if (contest.endDate > new Date() && !isUserOnContest) {
    return (
      <div className="w-full flex items-center justify-center mt-10 font-bold text-xl">
        Você poderá ver os problemas após o término do torneio.
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-4">
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
                "bg-green-500 text-primary-foreground": questionsAnswered.some(
                  (answer) => answer === option.label,
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
      {problem && (
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel className="pr-4 gap-4 flex flex-col">
            <ProblemDescription problem={problem} />
            {isUserOnContest && <SubmissionList problem={problem} />}
          </ResizablePanel>
          {isUserOnContest && contest.end > new Date() && (
            <Fragment>
              <ResizableHandle withHandle />
              <ResizablePanel className="pl-4">
                <UploadCode
                  contest={contest}
                  problem={problem}
                  problemLetter={
                    letters[
                      contest.problems.findIndex((p) => p.id === problem.id)
                    ] ?? ""
                  }
                />
              </ResizablePanel>
            </Fragment>
          )}
        </ResizablePanelGroup>
      )}
    </div>
  );
}
