"use client";

import type { User } from "better-auth";
import { Fragment, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ProblemDescription } from "@/app/[locale]/problems/_components/description";
import { Card, CardContent } from "@/components/ui/card";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type {
  Contest,
  ProblemOnContest,
  ProblemPreview,
  UserOnContest,
} from "@/drizzle/schema";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useUserContestStatus } from "@/hooks/use-user-contest-status";
import { Link, usePathname } from "@/i18n/navigation";
import { letters } from "@/lib/letters";
import { AiHelpDockPanel } from "../../ai-dialog";
import { AiHelpDockProvider } from "../../ai-help-dock";
import { SelectProblem } from "./select-problem";
import { SubmissionList } from "./submission-list";
import { UploadCode } from "./upload";

export function ProblemTab({
  user,
  contest,
}: {
  user: User;
  contest: Contest & {
    problems: ProblemOnContest[];
    users: UserOnContest[];
    canManage: boolean;
  };
}) {
  const t = useTranslations("ContestsPage.Tabs.Problem");
  const pathname = usePathname();
  const isWide = useMediaQuery("(min-width: 1024px)");
  const { data: liveAnswered } = useUserContestStatus(contest.id);
  const [problem, setProblem] = useState<ProblemPreview | null>(null);
  const isOwner = contest.canManage;
  const [isContestStarted, setIsContestStarted] = useState(
    () => isOwner || (!!contest.startDate && new Date() >= contest.startDate),
  );

  const isUserOnContest = contest.users.find(
    (userOnContest) => userOnContest.userId === user.id,
  );

  useEffect(() => {
    if (isOwner || isContestStarted || !contest.startDate) {
      return;
    }

    const interval = setInterval(() => {
      if (contest.startDate && new Date() >= contest.startDate) {
        setIsContestStarted(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOwner, isContestStarted, contest.startDate]);

  if (!isContestStarted) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12 font-bold text-xl text-muted-foreground">
          {t("notStarted")}
        </CardContent>
      </Card>
    );
  }

  if (
    !isOwner &&
    contest.endDate &&
    contest.endDate > new Date() &&
    !isUserOnContest
  ) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12 font-bold text-xl text-muted-foreground">
          {t("viewAfterEnd")}
        </CardContent>
      </Card>
    );
  }

  if (contest.problems.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <p className="font-bold text-xl text-muted-foreground">
            {t("noProblems")}
          </p>
          {isOwner && (
            <Link
              className="text-sm font-medium text-indigo-500 hover:underline"
              href={`${pathname}?tab=settings`}
            >
              {t("addProblemsLink")}
            </Link>
          )}
        </CardContent>
      </Card>
    );
  }

  const answeredLetters = liveAnswered ?? isUserOnContest?.answered ?? [];
  const currentProblemLetter = problem
    ? letters[contest.problems.findIndex((p) => p.problemId === problem.id)]
    : null;
  const isCurrentProblemSolved =
    currentProblemLetter && answeredLetters.includes(currentProblemLetter);
  const showEditor =
    !!isUserOnContest &&
    !!contest.endDate &&
    contest.endDate > new Date() &&
    !isCurrentProblemSolved;

  return (
    <Card className="w-full py-4">
      <CardContent className="flex flex-col w-full gap-4 px-4">
        <SelectProblem
          contest={contest}
          setProblem={setProblem}
          user={user}
          answered={answeredLetters}
        />

        {problem && (
          <AiHelpDockProvider>
          <ResizablePanelGroup
            className={
              isWide
                ? "h-[calc(100dvh-8rem)] min-h-[560px]"
                : "h-[140dvh] min-h-[900px]"
            }
            direction={isWide ? "horizontal" : "vertical"}
          >
            <ResizablePanel
              className={`flex flex-col gap-4 overflow-y-auto! ${isWide ? "pr-3" : "pb-3"}`}
              defaultSize={showEditor ? 45 : 100}
              id="statement"
              minSize={25}
              order={1}
            >
              <h2 className="font-bold text-2xl">
                {currentProblemLetter && `${currentProblemLetter}. `}
                {problem.title}
              </h2>
              <ProblemDescription problemId={problem.id} />
              {isUserOnContest && (
                <SubmissionList
                  problem={problem}
                  contest={contest}
                  user={user}
                />
              )}
            </ResizablePanel>
            {showEditor && (
              <Fragment>
                <ResizableHandle withHandle />
                <ResizablePanel
                  className={`flex min-h-0 flex-col ${isWide ? "pl-3" : "pt-3"}`}
                  defaultSize={55}
                  id="editor"
                  minSize={30}
                  order={2}
                >
                  <UploadCode
                    contest={contest}
                    problem={problem}
                    user={user}
                  />
                </ResizablePanel>
              </Fragment>
            )}
            <AiHelpDockPanel order={3} />
          </ResizablePanelGroup>
          </AiHelpDockProvider>
        )}
      </CardContent>
    </Card>
  );
}
