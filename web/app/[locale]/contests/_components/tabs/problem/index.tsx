"use client";

import type { User } from "better-auth";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { DifficultyBadge } from "@/app/[locale]/problems/_components/badge";
import { Card, CardContent } from "@/components/ui/card";
import type {
  Contest,
  ProblemOnContest,
  ProblemPreview,
  UserOnContest,
} from "@/drizzle/schema";
import { useUserContestStatus } from "@/hooks/use-user-contest-status";
import { Link, usePathname } from "@/i18n/navigation";
import { letters } from "@/lib/letters";
import { cn } from "@/lib/utils";

export function ProblemTab({
  user,
  contest,
}: {
  user: User;
  contest: Contest & {
    problems: (ProblemOnContest & { problem: ProblemPreview })[];
    users: UserOnContest[];
    canManage: boolean;
  };
}) {
  const t = useTranslations("ContestsPage.Tabs.Problem");
  const pathname = usePathname();
  const { data: liveAnswered } = useUserContestStatus(contest.id);
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

  return (
    <Card className="w-full py-4">
      <CardContent className="flex flex-col gap-2 px-4">
        {contest.problems.map((p, i) => {
          const letter = letters[i];
          const solved = answeredLetters.includes(letter);
          return (
            <Link
              className={cn(
                "flex items-center gap-4 border px-4 py-3 transition-colors hover:border-primary hover:bg-primary/5",
                solved && "border-green-600/50 bg-green-500/10",
              )}
              href={`/contests/${contest.slug}/problems/${p.problem.slug}`}
              key={p.problemId}
            >
              <span className="w-8 font-bold text-xl">{letter}</span>
              <span className="min-w-0 flex-1 truncate font-medium">
                {p.problem.title}
              </span>
              <DifficultyBadge difficulty={p.problem.difficulty} />
              {solved && (
                <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
              )}
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
