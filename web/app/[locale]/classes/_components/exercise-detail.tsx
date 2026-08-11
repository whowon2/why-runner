"use client";

import Editor from "@monaco-editor/react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Copy, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { toast } from "sonner";
import "katex/dist/katex.min.css";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import type { Language } from "@/drizzle/schema";
import { useCreateExerciseSubmission } from "@/hooks/use-create-exercise-submission";
import { useExercise } from "@/hooks/use-exercise";
import { useExerciseConstraints } from "@/hooks/use-exercise-constraints";
import { useExerciseSubmissions } from "@/hooks/use-exercise-submissions";
import { cn } from "@/lib/utils";

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
    <ResizablePanelGroup className="min-h-[70vh]" direction="horizontal">
      <ResizablePanel
        className="flex flex-col gap-4 pr-4"
        defaultSize={40}
        minSize={25}
      >
        <Card className="bg-transparent shadow-none">
          <CardHeader>
            <p className="text-muted-foreground text-sm">
              {exercise.primaryLanguage
                ? t("Lesson.primaryLanguage", {
                    language: exercise.primaryLanguage,
                  })
                : t("Lesson.anyLanguage")}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="prose dark:prose-invert max-w-none text-foreground prose-p:leading-relaxed prose-pre:bg-muted/50">
              <ReactMarkdown
                rehypePlugins={[rehypeKatex]}
                remarkPlugins={[remarkMath]}
              >
                {exercise.problem.description}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        <ExerciseConstraintsNotice exerciseId={exercise.id} />

        <ExerciseSubmissions exerciseId={exercise.id} />
      </ResizablePanel>

      <ResizableHandle withHandle />
      <ResizablePanel className="flex flex-col gap-4 pl-4" minSize={25}>
        <ExerciseSubmit
          exerciseId={exercise.id}
          locked={exercise.submissionsLocked}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function ExerciseSubmit({
  exerciseId,
  locked,
}: {
  exerciseId: string;
  locked: boolean;
}) {
  const t = useTranslations("RoadmapPage");
  const tUpload = useTranslations(
    "ContestsPage.Tabs.Problem.Submissions.Upload",
  );
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<Language | null>(null);
  const { theme, systemTheme } = useTheme();
  const { mutate, isPending } = useCreateExerciseSubmission();
  const queryClient = useQueryClient();

  if (locked) {
    return (
      <Card className="bg-transparent shadow-none">
        <CardContent>
          <p className="text-muted-foreground text-sm">{t("trackLocked")}</p>
        </CardContent>
      </Card>
    );
  }

  function handleSubmit() {
    if (!language) {
      toast.warning(tUpload("selectLanguage"));
      return;
    }
    if (!code.length) {
      toast.warning(tUpload("emptyCode"));
      return;
    }

    mutate(
      { exerciseId, code, language },
      {
        onError: (error) => {
          toast.error(tUpload("failedSubmit"), { description: error.message });
        },
        onSuccess: () => {
          toast.success(tUpload("submitted"));
          queryClient.invalidateQueries({
            queryKey: ["submissions", "exercise", exerciseId],
          });
        },
      },
    );
  }

  return (
    <Card className="bg-transparent shadow-none">
      <CardContent className="flex flex-col gap-4">
        <div className="flex justify-between gap-2">
          <Select onValueChange={(v) => setLanguage(v as Language)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={tUpload("languagePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button disabled={isPending} onClick={handleSubmit}>
            <Upload />
          </Button>
        </div>
        <Editor
          className="rounded-none"
          height="min(600px, 60vh)"
          language={language || ""}
          onChange={(c) => c !== undefined && setCode(c)}
          theme={
            theme === "system"
              ? systemTheme === "dark"
                ? "vs-dark"
                : "light"
              : theme === "dark"
                ? "vs-dark"
                : "light"
          }
          value={code}
          width="100%"
        />
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
                className={cn("rounded-md border px-3 last:border", {
                  "text-green-500 border-green-500": s.status === "PASSED",
                  "text-red-500 border-red-500": s.status === "FAILED",
                  "text-orange-500 border-orange-500": s.status === "ERROR",
                  "text-gray-500 border-gray-500": s.status === "PENDING",
                  "text-blue-500 border-blue-500": s.status === "RUNNING",
                  "text-purple-500 border-purple-500":
                    s.status === "CONSTRAINT_VIOLATION",
                  "text-indigo-500 border-indigo-500":
                    s.status === "PENDING_CONSTRAINT_CLASSIFICATION",
                })}
                key={s.id}
                value={s.id}
              >
                <AccordionTrigger className="text-sm">
                  <span>{s.createdAt.toLocaleTimeString()}</span>
                  <span className="flex items-center gap-1">
                    {s.status === "PASSED" && (
                      <CheckCircle2 className="size-4" />
                    )}
                    {s.language} · {s.status}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
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
                    <pre className="min-h-11 max-h-60 w-full overflow-auto whitespace-pre-wrap break-all rounded-md border bg-muted/50 p-2 pr-10 font-mono text-xs text-foreground">
                      {s.code}
                    </pre>
                  </div>
                  {s.constraintViolationDetail && (
                    <div className="mt-2 rounded-md border border-purple-200 bg-purple-50 p-2 font-mono text-purple-700 text-xs whitespace-pre-wrap dark:border-purple-900 dark:bg-purple-950/30 dark:text-purple-300">
                      {s.constraintViolationDetail}
                    </div>
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
