"use client";

import { BarChart3, FileDown, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { toast } from "sonner";
import { CodePane } from "@/components/workspace/code-pane";
import { ProblemStatement } from "@/components/workspace/problem-statement";
import { SolveStatus } from "@/components/workspace/solve-status";
import {
  type WorkspaceSource,
  WorkspaceProvider,
} from "@/components/workspace/workspace-context";
import {
  type RailItem,
  WorkspaceShell,
} from "@/components/workspace/workspace-shell";
import type { Problem, Submission } from "@/drizzle/schema";
import { useActionErrorMessage } from "@/hooks/use-action-error-message";
import { useCreateProblemSubmission } from "@/hooks/use-create-problem-submission";
import { useProblemPracticeSubmissions } from "@/hooks/use-problem-practice-submissions";
import { useProblemTests } from "@/hooks/use-problem-tests";
import { useRunsEnabled } from "@/hooks/use-runs-enabled";
import { authClient } from "@/lib/auth/client";
import { ProblemStatisticsTab } from "./statistics";
import { ProblemTestsTab } from "./tests";

/** Standalone (practice) problem in the fullscreen editor workspace. */
export function ProblemWorkspace({ problem }: { problem: Problem }) {
  const t = useTranslations("Workspace");
  const tSubmit = useTranslations("ProblemsPage.Workspace.Submit");
  const errorMessage = useActionErrorMessage();
  const { data: session } = authClient.useSession();
  // Admins manage every problem; the session role is only a UI hint, the
  // edit page re-checks it on the server.
  const isOwner =
    session?.user?.id === problem.createdBy || session?.user?.role === "admin";
  const runsEnabled = useRunsEnabled();
  const { data: tests } = useProblemTests(problem.id);
  const { data: submissions, isPending: submissionsPending } =
    useProblemPracticeSubmissions(problem.id);
  const { mutate, isPending: submitting } = useCreateProblemSubmission();

  const source = useMemo<WorkspaceSource>(
    () => ({
      tests: tests?.samples ?? [],
      hiddenCount: tests?.hiddenCount ?? 0,
      compare: { mode: problem.compareMode, epsilon: problem.floatEpsilon },
      runsEnabled,
      lockedReason: null,
      submissions: submissions as Submission[] | undefined,
      submissionsPending,
      ai: { maxLevel: null },
      submitting,
      submit: (answer) => {
        if (answer.mode !== "code") return;
        mutate(
          {
            code: answer.code,
            language: answer.language,
            problemId: problem.id,
          },
          {
            onError: (error) =>
              toast.error(tSubmit("failedSubmit"), {
                description: errorMessage(error),
              }),
          },
        );
      },
      toRunProgram: (answer) =>
        answer.mode === "code"
          ? {
              context: "problem",
              problemId: problem.id,
              code: answer.code,
              language: answer.language,
            }
          : null,
    }),
    [
      tests,
      problem,
      runsEnabled,
      submissions,
      submissionsPending,
      submitting,
      mutate,
      tSubmit,
      errorMessage,
    ],
  );

  const rail: RailItem[] = [
    {
      key: "statistics",
      label: t("Rail.statistics"),
      icon: BarChart3,
      panel: "statistics",
    },
    { key: "tests", label: t("Rail.tests"), icon: FileDown, panel: "tests" },
    ...(isOwner
      ? [
          {
            key: "edit",
            label: t("Rail.edit"),
            icon: Pencil,
            href: `/problems/${problem.slug}/edit`,
          },
        ]
      : []),
  ];

  return (
    <WorkspaceProvider source={source}>
      <WorkspaceShell
        back={{ href: "/problems", label: t("Rail.back") }}
        drawers={{
          statistics: {
            title: t("Drawers.statistics"),
            content: <ProblemStatisticsTab problemId={problem.id} />,
          },
          tests: {
            title: t("Drawers.tests"),
            content: <ProblemTestsTab problemId={problem.id} />,
          },
        }}
        editor={<CodePane draftTarget={{ kind: "problem", id: problem.id }} />}
        rail={rail}
        statement={<ProblemStatement problem={problem} />}
        status={<SolveStatus submissions={submissions} />}
        title={problem.title}
      />
    </WorkspaceProvider>
  );
}
