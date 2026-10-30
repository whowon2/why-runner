"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Code2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { toast } from "sonner";
import "katex/dist/katex.min.css";
import { DifficultyBadge } from "@/app/[locale]/problems/_components/badge";
import { ProblemExamples } from "@/app/[locale]/problems/_components/examples";
import { BlockWorkspace } from "@/components/blocks";
import { PortugolCodePanel } from "@/components/blocks/portugol-code-panel";
import { markdownComponents } from "@/components/markdown-components";
import { ParsonsEditor } from "@/components/parsons/parsons-editor";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CodePane } from "@/components/workspace/code-pane";
import {
  useWorkspace,
  type WorkspaceSource,
  WorkspaceProvider,
} from "@/components/workspace/workspace-context";
import {
  type RailItem,
  WorkspaceShell,
} from "@/components/workspace/workspace-shell";
import type { Submission } from "@/drizzle/schema";
import { useActionErrorMessage } from "@/hooks/use-action-error-message";
import { useCreateExerciseSubmission } from "@/hooks/use-create-exercise-submission";
import { useExercise } from "@/hooks/use-exercise";
import { useExerciseSubmissions } from "@/hooks/use-exercise-submissions";
import { useNextExercise } from "@/hooks/use-next-exercise";
import { usePreviousExercise } from "@/hooks/use-previous-exercise";
import { useRunsEnabled } from "@/hooks/use-runs-enabled";
import {
  generatePortugol,
  type SerializedWorkspace,
} from "@/lib/blocks/portugol-generator";
import type { ParsonsLine } from "@/lib/parsons";
import { ExerciseConstraintsNotice } from "./exercise-constraints-notice";

type Exercise = NonNullable<ReturnType<typeof useExercise>["data"]>;

/** Lesson exercise in the fullscreen editor workspace (code/blocks/parsons). */
export function ExerciseWorkspace({ exerciseId }: { exerciseId: string }) {
  const t = useTranslations("RoadmapPage");
  const { data: exercise, isPending } = useExercise(exerciseId);

  if (isPending) {
    return (
      <div className="fixed inset-0 z-40 bg-background p-4">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }
  if (!exercise) {
    return <p className="p-8 text-muted-foreground">{t("notFound")}</p>;
  }
  return <Workspace exercise={exercise} />;
}

function Workspace({ exercise }: { exercise: Exercise }) {
  const t = useTranslations("Workspace");
  const tUpload = useTranslations(
    "ContestsPage.Tabs.Problem.Submissions.Upload",
  );
  const errorMessage = useActionErrorMessage();
  const runsGate = useRunsEnabled();
  const { data: submissions, isPending: submissionsPending } =
    useExerciseSubmissions(exercise.id);
  const { mutate, isPending: submitting } = useCreateExerciseSubmission();
  const { data: next } = useNextExercise(exercise.id);
  const { data: previous } = usePreviousExercise(exercise.id);
  const lessonHref = `/classes/${exercise.lesson.classroom.slug}/lessons/${exercise.lesson.slug}`;

  const source = useMemo<WorkspaceSource>(
    () => ({
      tests: exercise.tests,
      hiddenCount: exercise.hiddenTestCount,
      compare: {
        mode: exercise.problem.compareMode,
        epsilon: exercise.problem.floatEpsilon,
      },
      runsEnabled: runsGate && exercise.mode !== "parsons",
      lockedReason: exercise.submissionsLocked ? t("Locked.dueDate") : null,
      submissions: submissions as Submission[] | undefined,
      submissionsPending,
      ai: { maxLevel: null },
      submitting,
      submit: (answer) =>
        mutate(
          answer.mode === "code"
            ? {
                exerciseId: exercise.id,
                mode: "code",
                code: answer.code,
                language: answer.language,
              }
            : answer.mode === "blocks"
              ? {
                  exerciseId: exercise.id,
                  mode: "blocks",
                  workspace: answer.workspace,
                }
              : {
                  exerciseId: exercise.id,
                  mode: "parsons",
                  lines: answer.lines,
                },
          {
            onError: (error) =>
              toast.error(tUpload("failedSubmit"), {
                description: errorMessage(error),
              }),
          },
        ),
      toRunProgram: (answer) =>
        answer.mode === "code"
          ? {
              context: "exercise",
              exerciseId: exercise.id,
              mode: "code",
              code: answer.code,
              language: answer.language,
            }
          : answer.mode === "blocks"
            ? {
                context: "exercise",
                exerciseId: exercise.id,
                mode: "blocks",
                workspace: answer.workspace,
              }
            : null,
    }),
    [
      exercise,
      runsGate,
      submissions,
      submissionsPending,
      submitting,
      mutate,
      t,
      tUpload,
      errorMessage,
    ],
  );

  const exerciseHref = (slug: string) => `${lessonHref}/exercises/${slug}`;
  const rail: RailItem[] = [
    ...(previous
      ? [
          {
            key: "previous",
            label: t("Rail.previous"),
            icon: ArrowLeft,
            href: exerciseHref(previous.slug),
          },
        ]
      : []),
    ...(next
      ? [
          {
            key: "next",
            label: t("Rail.next"),
            icon: ArrowRight,
            href: exerciseHref(next.slug),
          },
        ]
      : []),
  ];

  const editor =
    exercise.mode === "blocks" ? (
      <BlocksPane />
    ) : exercise.mode === "parsons" && exercise.parsonsShuffled ? (
      <ParsonsPane lines={exercise.parsonsShuffled} />
    ) : (
      <CodePane draftTarget={{ kind: "exercise", id: exercise.id }} />
    );

  return (
    <WorkspaceProvider source={source}>
      <WorkspaceShell
        back={{ href: lessonHref, label: t("Rail.back") }}
        editor={editor}
        rail={rail}
        statement={<ExerciseStatement exercise={exercise} />}
        status={
          exercise.done ? (
            <span className="flex items-center gap-1.5 font-medium text-green-600 dark:text-green-400">
              <CheckCircle2 className="size-4" />
              {t("Status.completed")}
            </span>
          ) : null
        }
        title={exercise.problem.title}
      />
    </WorkspaceProvider>
  );
}

function ExerciseStatement({ exercise }: { exercise: Exercise }) {
  const t = useTranslations("RoadmapPage.Lesson");
  const tWs = useTranslations("Workspace.Status");
  const tProblems = useTranslations("ProblemsPage");
  const tExamples = useTranslations("ContestsPage.Tabs.Problem.Examples");
  const { problem } = exercise;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <DifficultyBadge difficulty={problem.difficulty} />
        <span className="text-muted-foreground">
          {exercise.mode === "blocks"
            ? t("answerWithBlocks")
            : exercise.mode === "parsons"
              ? t("answerWithParsons")
              : exercise.primaryLanguage
                ? t("primaryLanguage", { language: exercise.primaryLanguage })
                : t("anyLanguage")}
        </span>
        <span className="ml-auto text-muted-foreground text-xs">
          {tWs("limits", {
            seconds: problem.timeLimitMs / 1000,
            mb: problem.memoryLimitMb,
          })}
        </span>
      </div>
      {problem.narrative && (
        <div className="border-l-2 border-muted-foreground/30 pl-4 italic text-muted-foreground">
          <span className="not-italic text-[10px] font-semibold uppercase tracking-wider">
            {tProblems("Workspace.Task.narrativeLabel")}
          </span>
          <div className="prose dark:prose-invert prose-sm mt-1 max-w-none">
            <ReactMarkdown components={markdownComponents}>
              {problem.narrative}
            </ReactMarkdown>
          </div>
        </div>
      )}
      <div className="prose dark:prose-invert max-w-none text-foreground prose-p:leading-relaxed prose-pre:bg-muted/50">
        <ReactMarkdown
          components={markdownComponents}
          rehypePlugins={[rehypeKatex]}
          remarkPlugins={[remarkMath]}
        >
          {problem.description}
        </ReactMarkdown>
      </div>
      {exercise.tests.length > 0 && (
        <>
          <h2 className="font-semibold text-xl">{tExamples("title")}</h2>
          <ProblemExamples
            inputs={exercise.tests.map((x) => x.input)}
            outputs={exercise.tests.map((x) => x.output)}
          />
        </>
      )}
      <ExerciseConstraintsNotice exerciseId={exercise.id} />
    </div>
  );
}

/** Blockly editor; the answer is the serialized workspace. */
function BlocksPane() {
  const tBlocks = useTranslations("Blocks");
  const { registerAnswer, setLanguage } = useWorkspace();
  const [workspace, setWorkspace] = useState<SerializedWorkspace | null>(null);
  const [showCode, setShowCode] = useState(false);
  const generated = useMemo(
    () => (workspace ? generatePortugol(workspace) : null),
    [workspace],
  );
  const current = useRef({ workspace, generated });
  current.current = { workspace, generated };

  useEffect(() => setLanguage("portugol"), [setLanguage]);
  useEffect(() => {
    registerAnswer({
      getAnswer: () => {
        const { workspace, generated } = current.current;
        // Invalid blocks: show the generated code with its errors instead.
        if (!workspace || !generated || generated.errors.length > 0) {
          setShowCode(true);
          return null;
        }
        return { mode: "blocks", workspace };
      },
    });
    return () => registerAnswer(null);
  }, [registerAnswer]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex">
        <Button
          onClick={() => setShowCode((v) => !v)}
          size="sm"
          type="button"
          variant="outline"
        >
          <Code2 />
          {showCode ? tBlocks("hideCode") : tBlocks("viewCode")}
        </Button>
      </div>
      <BlockWorkspace
        className="min-h-0 w-full flex-1"
        onChange={setWorkspace}
      />
      {showCode && generated && (
        <div className="max-h-[40%] overflow-auto">
          <PortugolCodePanel code={generated.code} errors={generated.errors} />
        </div>
      )}
    </div>
  );
}

/** Parsons editor; the answer is the ordered, indented lines. */
function ParsonsPane({ lines }: { lines: string[] }) {
  const { registerAnswer } = useWorkspace();
  const [answer, setAnswer] = useState<ParsonsLine[]>(() =>
    lines.map((text) => ({ text, indent: 0 })),
  );
  const current = useRef(answer);
  current.current = answer;

  useEffect(() => {
    registerAnswer({
      getAnswer: () => ({ mode: "parsons", lines: current.current }),
    });
    return () => registerAnswer(null);
  }, [registerAnswer]);

  return (
    <div className="h-full overflow-y-auto">
      <ParsonsEditor lines={lines} onChange={setAnswer} />
    </div>
  );
}
