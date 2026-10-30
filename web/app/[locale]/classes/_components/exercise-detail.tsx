"use client";

import { CheckCircle2, Code2, Copy, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { toast } from "sonner";
import "katex/dist/katex.min.css";
import { markdownComponents } from "@/components/markdown-components";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CodeEditor } from "@/components/code-editor";
import {
  RunButton,
  RunPanel,
  type RunProgram,
  useCodeRunner,
} from "@/components/code-run/code-run";
import { useRunsEnabled } from "@/hooks/use-runs-enabled";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BlockWorkspace } from "@/components/blocks";
import { PortugolCodePanel } from "@/components/blocks/portugol-code-panel";
import {
  ResetCodeButton,
  useStarterComments,
} from "@/components/reset-code-button";
import { ParsonsEditor } from "@/components/parsons/parsons-editor";
import { LatestVerdict } from "@/components/submissions/latest-verdict";
import { SubmissionDetails } from "@/components/submissions/submission-details";
import { VisualAnswer } from "@/components/submissions/visual-answer";
import type { Language } from "@/drizzle/schema";
import { useActionErrorMessage } from "@/hooks/use-action-error-message";
import { useCodeDraft } from "@/hooks/use-code-draft";
import { useCreateExerciseSubmission } from "@/hooks/use-create-exercise-submission";
import { useExercise } from "@/hooks/use-exercise";
import { useExerciseConstraints } from "@/hooks/use-exercise-constraints";
import { useExerciseSubmissions } from "@/hooks/use-exercise-submissions";
import {
  generatePortugol,
  type SerializedWorkspace,
} from "@/lib/blocks/portugol-generator";
import type { VisibleTest } from "@/lib/judge-report";
import type { ParsonsLine } from "@/lib/parsons";
import { nextCodeOnLanguageChange } from "@/lib/starter-code";
import { cn } from "@/lib/utils";
import {
  AIDialog,
  AiHelpDockPanel,
} from "../../contests/_components/ai-dialog";
import { AiHelpDockProvider } from "../../contests/_components/ai-help-dock";
import { StatusBadge } from "@/components/submissions/status-badge";
import { isFinalFailure, statusTone } from "@/lib/submission-status";

const LANGUAGES: Language[] = [
  "rust",
  "cpp",
  "c",
  "java",
  "python",
  "portugol",
];

export function ExerciseDetail({ exerciseId }: { exerciseId: string }) {
  const t = useTranslations("RoadmapPage");
  const { data: exercise, isPending } = useExercise(exerciseId);

  if (isPending) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!exercise) {
    return <p className="text-muted-foreground">{t("notFound")}</p>;
  }

  return (
    <AiHelpDockProvider>
    <ResizablePanelGroup className="min-h-[70vh]" direction="horizontal">
      <ResizablePanel
        className="flex flex-col gap-4 pr-4"
        defaultSize={40}
        id="statement"
        minSize={25}
        order={1}
      >
        <Card className="bg-transparent shadow-none">
          <CardHeader>
            <p className="text-muted-foreground text-sm">
              {exercise.mode === "blocks"
                ? t("Lesson.answerWithBlocks")
                : exercise.mode === "parsons"
                  ? t("Lesson.answerWithParsons")
                  : exercise.primaryLanguage
                    ? t("Lesson.primaryLanguage", {
                        language: exercise.primaryLanguage,
                      })
                    : t("Lesson.anyLanguage")}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="prose dark:prose-invert max-w-none text-foreground prose-p:leading-relaxed prose-pre:bg-muted/50">
              <ReactMarkdown
                components={markdownComponents}
                rehypePlugins={[rehypeKatex]}
                remarkPlugins={[remarkMath]}
              >
                {exercise.problem.description}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        <ExerciseTestCases
          hiddenCount={exercise.hiddenTestCount}
          tests={exercise.tests}
        />

        <ExerciseConstraintsNotice exerciseId={exercise.id} />

        <ExerciseSubmissions exerciseId={exercise.id} />
      </ResizablePanel>

      <ResizableHandle withHandle />
      <ResizablePanel
        className="flex flex-col gap-4 pl-4"
        id="editor"
        minSize={25}
        order={2}
      >
        {exercise.submissionsLocked ? (
          <Card className="bg-transparent shadow-none">
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {t("trackLocked")}
              </p>
            </CardContent>
          </Card>
        ) : exercise.mode === "blocks" ? (
          <BlocksSubmit
            defaultStdin={exercise.tests[0]?.input}
            exerciseId={exercise.id}
          />
        ) : exercise.mode === "parsons" && exercise.parsonsShuffled ? (
          <ParsonsSubmit
            exerciseId={exercise.id}
            lines={exercise.parsonsShuffled}
          />
        ) : (
          <ExerciseSubmit
            defaultStdin={exercise.tests[0]?.input}
            exerciseId={exercise.id}
          />
        )}
      </ResizablePanel>
      <AiHelpDockPanel order={3} />
    </ResizablePanelGroup>
    </AiHelpDockProvider>
  );
}

function BlocksSubmit({
  exerciseId,
  defaultStdin,
}: {
  exerciseId: string;
  /** First visible example input, already shown on this page. */
  defaultStdin?: string;
}) {
  const tBlocks = useTranslations("Blocks");
  const tUpload = useTranslations(
    "ContestsPage.Tabs.Problem.Submissions.Upload",
  );
  const errorMessage = useActionErrorMessage();
  const [workspace, setWorkspace] = useState<SerializedWorkspace | null>(null);
  const [showCode, setShowCode] = useState(false);
  const { mutate, isPending } = useCreateExerciseSubmission();
  const { data: submissions } = useExerciseSubmissions(exerciseId);
  const runner = useCodeRunner(defaultStdin);
  const runsEnabled = useRunsEnabled();

  const generated = useMemo(
    () => (workspace ? generatePortugol(workspace) : null),
    [workspace],
  );
  const hasErrors = !generated || generated.errors.length > 0;

  function runProgram(): RunProgram | null {
    if (!workspace || hasErrors) {
      setShowCode(true);
      return null;
    }
    return { context: "exercise", exerciseId, mode: "blocks", workspace };
  }

  function handleSubmit() {
    if (!workspace || hasErrors) {
      setShowCode(true);
      return;
    }
    mutate(
      { exerciseId, mode: "blocks", workspace },
      {
        onError: (error) =>
          toast.error(tUpload("failedSubmit"), {
            description: errorMessage(error),
          }),
        onSuccess: () => toast.success(tUpload("submitted")),
      },
    );
  }

  return (
    <Card className="bg-transparent shadow-none">
      <CardContent className="flex flex-col gap-4">
        <div className="flex justify-between gap-2">
          <Button
            onClick={() => setShowCode((v) => !v)}
            type="button"
            variant="outline"
          >
            <Code2 />
            {showCode ? tBlocks("hideCode") : tBlocks("viewCode")}
          </Button>
          <div className="flex gap-2">
            <LatestVerdict submission={submissions?.[0]} />
            {runsEnabled && (
              <RunButton
                compact
                onRun={() => runner.run(runProgram())}
                runner={runner}
              />
            )}
            <Button disabled={isPending} onClick={handleSubmit}>
              <Upload />
            </Button>
          </div>
        </div>
        <BlockWorkspace
          className="h-[min(600px,60vh)] w-full"
          onChange={setWorkspace}
        />
        {showCode && generated && (
          <PortugolCodePanel code={generated.code} errors={generated.errors} />
        )}
        {runsEnabled && <RunPanel language="portugol" runner={runner} />}
      </CardContent>
    </Card>
  );
}

function ParsonsSubmit({
  exerciseId,
  lines,
}: {
  exerciseId: string;
  lines: string[];
}) {
  const tUpload = useTranslations(
    "ContestsPage.Tabs.Problem.Submissions.Upload",
  );
  const errorMessage = useActionErrorMessage();
  const [answer, setAnswer] = useState<ParsonsLine[]>(() =>
    lines.map((text) => ({ text, indent: 0 })),
  );
  const { mutate, isPending } = useCreateExerciseSubmission();
  const { data: submissions } = useExerciseSubmissions(exerciseId);

  function handleSubmit() {
    mutate(
      { exerciseId, mode: "parsons", lines: answer },
      {
        onError: (error) =>
          toast.error(tUpload("failedSubmit"), {
            description: errorMessage(error),
          }),
        onSuccess: () => toast.success(tUpload("submitted")),
      },
    );
  }

  return (
    <Card className="bg-transparent shadow-none">
      <CardContent className="flex flex-col gap-4">
        <div className="flex justify-end gap-2">
          <LatestVerdict submission={submissions?.[0]} />
          <Button disabled={isPending} onClick={handleSubmit}>
            <Upload />
          </Button>
        </div>
        <ParsonsEditor lines={lines} onChange={setAnswer} />
      </CardContent>
    </Card>
  );
}

function ExerciseSubmit({
  exerciseId,
  defaultStdin,
}: {
  exerciseId: string;
  /** First visible example input, already shown on this page. */
  defaultStdin?: string;
}) {
  const tUpload = useTranslations(
    "ContestsPage.Tabs.Problem.Submissions.Upload",
  );
  const errorMessage = useActionErrorMessage();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<Language | null>(null);
  const { mutate, isPending } = useCreateExerciseSubmission();
  const { data: submissions } = useExerciseSubmissions(exerciseId);
  const starterComments = useStarterComments();
  const { draftFor, clearDraft } = useCodeDraft({
    target: { kind: "exercise", id: exerciseId },
    code,
    setCode,
    language,
    setLanguage,
    latest: submissions?.[0],
  });
  const runner = useCodeRunner(defaultStdin);
  const runsEnabled = useRunsEnabled();

  function handleLanguageChange(value: string) {
    const next = value as Language;
    setCode(
      nextCodeOnLanguageChange(
        code,
        language,
        next,
        starterComments,
        draftFor(next),
      ),
    );
    setLanguage(next);
  }

  /** The chosen language, or null after warning about what's missing. */
  function checkProgram(): Language | null {
    if (!language) {
      toast.warning(tUpload("selectLanguage"));
      return null;
    }
    if (!code.length) {
      toast.warning(tUpload("emptyCode"));
      return null;
    }
    return language;
  }

  function runProgram(): RunProgram | null {
    const lang = checkProgram();
    if (!lang) return null;
    return {
      context: "exercise",
      exerciseId,
      mode: "code",
      code,
      language: lang,
    };
  }

  function handleSubmit() {
    const lang = checkProgram();
    if (!lang) return;

    mutate(
      { exerciseId, mode: "code", code, language: lang },
      {
        onError: (error) => {
          toast.error(tUpload("failedSubmit"), {
            description: errorMessage(error),
          });
        },
        onSuccess: () => {
          toast.success(tUpload("submitted"));
        },
      },
    );
  }

  return (
    <Card className="bg-transparent shadow-none">
      <CardContent className="flex flex-col gap-4">
        <CodeEditor
          height="min(600px, 60vh)"
          language={language || ""}
          onChange={(c) => c !== undefined && setCode(c)}
          toolbar={
            <div className="flex justify-between gap-2">
              <Select
                onValueChange={handleLanguageChange}
                value={language ?? undefined}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={tUpload("languagePlaceholder")} />
                </SelectTrigger>
                <SelectContent className="notranslate" translate="no">
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ResetCodeButton
                code={code}
                language={language}
                onReset={(starter) => {
                  clearDraft(language);
                  setCode(starter);
                }}
                onUndo={setCode}
              />
              <LatestVerdict submission={submissions?.[0]} />
              {runsEnabled && (
                <RunButton
                  compact
                  onRun={() => runner.run(runProgram())}
                  runner={runner}
                />
              )}
              <Button disabled={isPending} onClick={handleSubmit}>
                <Upload />
              </Button>
            </div>
          }
          value={code}
        />
        {runsEnabled && <RunPanel language={language} runner={runner} />}
      </CardContent>
    </Card>
  );
}

// Only the tests this viewer may see arrive from the server (see
// `getExercise`), numbered as in the problem so they match failing-test
// reports; the rest are just counted.
function ExerciseTestCases({
  tests,
  hiddenCount,
}: {
  tests: VisibleTest[];
  hiddenCount: number;
}) {
  const t = useTranslations("RoadmapPage.Lesson");

  if (tests.length === 0 && hiddenCount === 0) return null;

  return (
    <Card className="bg-transparent shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{t("testCasesTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {tests.map(({ index, input, output }) => (
          <div className="flex flex-col gap-1" key={index}>
            <p className="text-muted-foreground text-xs">
              {t("testCaseInput", { index })}
            </p>
            <pre
              translate="no"
              className="notranslate w-full overflow-auto whitespace-pre-wrap break-all rounded-md border bg-muted/50 p-2 font-mono text-xs text-foreground"
            >
              {input}
            </pre>
            <p className="text-muted-foreground text-xs">
              {t("testCaseOutput", { index })}
            </p>
            <pre
              translate="no"
              className="notranslate w-full overflow-auto whitespace-pre-wrap break-all rounded-md border bg-muted/50 p-2 font-mono text-xs text-foreground"
            >
              {output}
            </pre>
          </div>
        ))}
        {hiddenCount > 0 && (
          <p className="text-muted-foreground text-sm">
            {tests.length === 0
              ? t("allTestCasesHidden", { count: hiddenCount })
              : t("hiddenTestCases", { count: hiddenCount })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Read-only, shown to every class member so students know what's expected
// *before* they submit, not just after a violation. Mutation UI (add/edit/
// remove) stays in the owner-only dialog on the lesson page.
function ExerciseConstraintsNotice({ exerciseId }: { exerciseId: string }) {
  const t = useTranslations("RoadmapPage.Constraints");
  const { data: constraints } = useExerciseConstraints(exerciseId);

  if (!constraints || constraints.length === 0) return null;

  return (
    <Card className="bg-transparent shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {constraints.map((c) => {
          if (c.kind === "algorithm_requirement") {
            return (
              <p key={c.id}>
                <span className="font-medium">{t("algorithmTitle")}:</span>{" "}
                {c.description}
              </p>
            );
          }

          let params: Record<string, unknown> = {};
          try {
            params = c.ruleParams ? JSON.parse(c.ruleParams) : {};
          } catch {
            params = {};
          }

          const constructs = Array.isArray(params.constructs)
            ? params.constructs.join(", ")
            : "?";

          let label: string;
          switch (c.ruleType) {
            case "max_loop_nesting_depth":
              label = `${t("maxLoopNestingDepth")}: ${params.maxDepth ?? "?"}`;
              break;
            case "required_construct":
              label = `${t("requiredConstruct")}: ${constructs}`;
              break;
            default:
              label = `${t("forbiddenConstruct")}: ${constructs}`;
          }

          return <p key={c.id}>{label}</p>;
        })}
      </CardContent>
    </Card>
  );
}

function ExerciseSubmissions({ exerciseId }: { exerciseId: string }) {
  const t = useTranslations("RoadmapPage.Lesson");
  const tCommon = useTranslations("ContestsPage.Tabs.Problem.Submissions");
  const { data: submissions, isPending } = useExerciseSubmissions(exerciseId);

  if (isPending) return <Skeleton className="h-32 w-full" />;

  return (
    <Card className="bg-transparent shadow-none">
      <CardHeader>
        <CardTitle>{t("submissionsTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        {!submissions || submissions.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {tCommon("noSubmissions")}
          </p>
        ) : (
          <Accordion
            className="flex w-full flex-col gap-2"
            collapsible
            type="single"
          >
            {submissions.map((s) => (
              <AccordionItem
                className={cn(
                  "rounded-md border px-3 last:border",
                  statusTone(s.status),
                )}
                key={s.id}
                value={s.id}
              >
                <AccordionTrigger className="text-sm">
                  <span>{s.createdAt.toLocaleTimeString()}</span>
                  <span className="flex items-center gap-1">
                    {s.status === "PASSED" && (
                      <CheckCircle2 className="size-4" />
                    )}
                    {s.language} · <StatusBadge status={s.status} />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="flex flex-col gap-2">
                  {isFinalFailure(s.status) && (
                    <div className="flex justify-end">
                      <AIDialog maxLevel={null} submission={s} />
                    </div>
                  )}
                  <VisualAnswer submission={s} />
                  <div className="relative">
                    <Button
                      className="absolute top-2 right-2 size-7"
                      onClick={() => {
                        navigator.clipboard.writeText(s.code);
                        toast.success(t("codeCopied"));
                      }}
                      size="icon"
                      variant="outline"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <pre
                      translate="no"
                      className="notranslate min-h-11 max-h-60 w-full overflow-auto whitespace-pre-wrap break-all rounded-md border bg-muted/50 p-2 pr-10 font-mono text-xs text-foreground"
                    >
                      {s.code}
                    </pre>
                  </div>
                  {s.output && (
                    <SubmissionDetails
                      constraintViolationDetail={s.constraintViolationDetail}
                      output={s.output}
                      status={s.status}
                    />
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
