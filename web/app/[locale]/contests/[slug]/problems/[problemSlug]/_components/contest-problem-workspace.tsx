"use client";

import { ArrowLeft, Lock, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useMemo } from "react";
import { toast } from "sonner";
import { Leaderboard } from "@/app/[locale]/contests/_components/tabs/leaderboard";
import { Button } from "@/components/ui/button";
import { CodePane } from "@/components/workspace/code-pane";
import { ProblemStatement } from "@/components/workspace/problem-statement";
import {
  type WorkspaceSource,
  WorkspaceProvider,
} from "@/components/workspace/workspace-context";
import {
  type RailItem,
  WorkspaceShell,
} from "@/components/workspace/workspace-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { useActionErrorMessage } from "@/hooks/use-action-error-message";
import { useContest } from "@/hooks/use-contest";
import { useCreateSubmission } from "@/hooks/use-create-submission";
import { useProblemSubmissions } from "@/hooks/use-problem-submissions";
import { useProblemTests } from "@/hooks/use-problem-tests";
import { useRunsEnabled } from "@/hooks/use-runs-enabled";
import { useUserContestStatus } from "@/hooks/use-user-contest-status";
import { Link } from "@/i18n/navigation";
import { letters } from "@/lib/letters";
import { ContestTimer, formatDuration, useNow } from "./contest-timer";

type ContestData = NonNullable<ReturnType<typeof useContest>["data"]>;

/**
 * Contest problem in the editor workspace (contest-problem-layout spec):
 * letters and leaderboard in the rail, timer and solved count in the top
 * bar. Applies the access rules the old Problems tab had.
 */
export function ContestProblemWorkspace({
  contestId,
  problemSlug,
  userId,
}: {
  contestId: string;
  problemSlug: string;
  userId: string;
}) {
  const t = useTranslations("ContestsPage");
  const { data: contest, isPending } = useContest(contestId);
  const now = useNow();

  if (isPending || !now) {
    return (
      <div className="fixed inset-0 z-40 bg-background p-4">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }
  if (!contest) {
    return <Notice backHref="/contests">{t("notFound")}</Notice>;
  }

  const back = `/contests/${contest.slug}`;
  const index = contest.problems.findIndex(
    (p) => p.problem.slug === problemSlug,
  );
  const isOwner = contest.canManage;
  const member = contest.users.find((u) => u.userId === userId);

  if (contest.joinStatus === "pending") {
    return <Notice backHref={back}>{t("Tabs.pendingDescription")}</Notice>;
  }
  if (!isOwner && (!contest.startDate || now < contest.startDate)) {
    return (
      <Notice backHref={back}>
        {t("Tabs.Problem.notStarted")}
        {contest.startDate && (
          <span className="mt-2 block font-mono text-base tabular-nums">
            {formatDuration(contest.startDate.getTime() - now.getTime())}
          </span>
        )}
      </Notice>
    );
  }
  if (!isOwner && contest.endDate && contest.endDate > now && !member) {
    return <Notice backHref={back}>{t("Tabs.Problem.viewAfterEnd")}</Notice>;
  }
  if (index === -1) {
    return <Notice backHref={back}>{t("Tabs.Problem.notFoundInContest")}</Notice>;
  }

  return (
    <ContestWorkspace
      contest={contest}
      index={index}
      isMember={!!member}
      now={now}
      userId={userId}
    />
  );
}

function ContestWorkspace({
  contest,
  index,
  isMember,
  now,
  userId,
}: {
  contest: ContestData;
  index: number;
  isMember: boolean;
  now: Date;
  userId: string;
}) {
  const t = useTranslations("Workspace");
  const tUpload = useTranslations(
    "ContestsPage.Tabs.Problem.Submissions.Upload",
  );
  const errorMessage = useActionErrorMessage();
  const problem = contest.problems[index].problem;
  const letter = letters[index];
  const { data: liveAnswered } = useUserContestStatus(contest.id);
  const answered =
    liveAnswered ??
    contest.users.find((u) => u.userId === userId)?.answered ??
    [];
  const runsGate = useRunsEnabled();
  const { data: tests } = useProblemTests(problem.id);
  const { data: rows, isPending: submissionsPending } = useProblemSubmissions({
    problemId: problem.id,
    contestId: contest.id,
    userId,
  });
  // Contest owners get everyone's rows, in no particular order.
  const submissions = useMemo(
    () =>
      rows
        ?.filter((s) => s.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [rows, userId],
  );
  const { mutate, isPending: submitting } = useCreateSubmission();

  const ended = !!contest.endDate && contest.endDate <= now;
  const lockedReason = !isMember
    ? t("Locked.notParticipant")
    : ended || !contest.endDate
      ? t("Locked.contestEnded")
      : answered.includes(letter)
        ? t("Locked.solved")
        : null;

  const source = useMemo<WorkspaceSource>(
    () => ({
      tests: tests?.samples ?? [],
      hiddenCount: tests?.hiddenCount ?? 0,
      compare: { mode: problem.compareMode, epsilon: problem.floatEpsilon },
      runsEnabled: runsGate && contest.allowRuns && isMember,
      lockedReason,
      submissions,
      submissionsPending,
      ai:
        contest.aiAssistance === "off"
          ? false
          : { maxLevel: contest.aiAssistance },
      submitting,
      submit: (answer) => {
        if (answer.mode !== "code") return;
        mutate(
          {
            code: answer.code,
            contestId: contest.id,
            language: answer.language,
            problemId: problem.id,
          },
          {
            onError: (error) =>
              toast.error(tUpload("failedSubmit"), {
                description: errorMessage(error),
              }),
          },
        );
      },
      toRunProgram: (answer) =>
        answer.mode === "code"
          ? {
              context: "contest",
              contestId: contest.id,
              problemId: problem.id,
              code: answer.code,
              language: answer.language,
            }
          : null,
    }),
    [
      tests,
      problem,
      runsGate,
      contest,
      isMember,
      lockedReason,
      submissions,
      submissionsPending,
      submitting,
      mutate,
      tUpload,
      errorMessage,
    ],
  );

  const rail: RailItem[] = [
    ...contest.problems.map((p, i) => ({
      key: `problem-${p.problemId}`,
      label: p.problem.title,
      icon: letters[i],
      href: `/contests/${contest.slug}/problems/${p.problem.slug}`,
      active: i === index,
      done: answered.includes(letters[i]),
    })),
    {
      key: "leaderboard",
      label: t("Rail.leaderboard"),
      icon: Trophy,
      panel: "leaderboard",
    },
  ];

  return (
    <WorkspaceProvider source={source}>
      <WorkspaceShell
        back={{ href: `/contests/${contest.slug}`, label: t("Rail.back") }}
        drawers={{
          leaderboard: {
            title: t("Drawers.leaderboard"),
            content: <Leaderboard contest={contest} userId={userId} />,
          },
        }}
        editor={
          <CodePane
            draftTarget={{
              kind: "contest",
              id: `${contest.id}:${problem.id}`,
            }}
          />
        }
        rail={rail}
        statement={<ProblemStatement problem={problem} />}
        status={
          <>
            <span className="text-muted-foreground">
              {t("Status.solvedCount", {
                solved: answered.length,
                total: contest.problems.length,
              })}
            </span>
            <ContestTimer endDate={contest.endDate} />
          </>
        }
        title={`${letter}. ${problem.title}`}
      />
    </WorkspaceProvider>
  );
}

function Notice({
  backHref,
  children,
}: {
  backHref: string;
  children: ReactNode;
}) {
  const t = useTranslations("Workspace.Rail");
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 p-6 text-center">
      <Lock className="size-8 text-muted-foreground" />
      <p className="max-w-md font-semibold text-lg text-muted-foreground">
        {children}
      </p>
      <Button asChild variant="outline">
        <Link href={backHref}>
          <ArrowLeft />
          {t("back")}
        </Link>
      </Button>
    </div>
  );
}
