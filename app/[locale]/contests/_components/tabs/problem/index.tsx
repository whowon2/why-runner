"use client";

import type { User } from "better-auth";
import { Fragment, useEffect, useState } from "react";
import { ProblemDescription } from "@/app/[locale]/problems/_components/description";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type {
  Contest,
  Problem,
  ProblemOnContest,
  UserOnContest,
} from "@/lib/db/schema";
import { letters } from "@/lib/letters";
import { SelectProblem } from "./select-problem";
import { SubmissionList } from "./submission-list";
import { UploadCode } from "./upload";
import { useContestSubmissions } from "@/hooks/use-contest-submissions";
import { isProblemSolved } from "@/lib/utils";

export function ProblemTab({
  user,
  contest,
}: {
  user: User;
  contest: Contest & {
    problems: ProblemOnContest[];
    users: UserOnContest[];
  };
}) {
  const { data: submissions } = useContestSubmissions({
    contestId: contest.id,
  });
  const [problem, setProblem] = useState<Problem | null>(null);
  const [isContestStarted, setIsContestStarted] = useState(
    () => new Date() >= contest.startDate,
  );

  const isUserOnContest = contest.users.find(
    (userOnContest) => userOnContest.userId === user.id,
  );

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

  const solvedProblems =
    submissions
      ?.filter((sub) => sub.status === "PASSED" && sub.userId === user.id)
      .map((sub) => sub.problem) ?? [];

  return (
    <div className="flex flex-col w-full gap-4">
      <SelectProblem
        contest={contest}
        setProblem={setProblem}
        user={user}
        solved={solvedProblems}
      />

      {problem && (
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel className="pr-4 gap-4 flex flex-col">
            <ProblemDescription problemId={problem.id} />
            {isUserOnContest && (
              <SubmissionList problem={problem} contest={contest} user={user} />
            )}
          </ResizablePanel>
          {isUserOnContest &&
            contest.endDate > new Date() &&
            !isProblemSolved(problem.id, solvedProblems) && (
              <Fragment>
                <ResizableHandle withHandle />
                <ResizablePanel className="pl-4">
                  <UploadCode
                    user={user}
                    contest={contest}
                    problem={problem}
                    problemLetter={
                      letters[
                        contest.problems.findIndex(
                          (p) => p.problemId === problem.id,
                        )
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
