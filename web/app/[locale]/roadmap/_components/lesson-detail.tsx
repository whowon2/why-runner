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
import { useCreateLessonSubmission } from "@/hooks/use-create-lesson-submission";
import { useLesson } from "@/hooks/use-lesson";
import { useLessonSubmissions } from "@/hooks/use-lesson-submissions";
import { cn } from "@/lib/utils";

const LANGUAGES: Language[] = [
  "rust",
  "cpp",
  "c",
  "java",
  "python",
  "portugol",
];

export function LessonDetail({ lessonId }: { lessonId: string }) {
  const t = useTranslations("RoadmapPage");
  const { data: lesson, isPending } = useLesson(lessonId);

  if (isPending) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!lesson) {
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
              {lesson.primaryLanguage
                ? t("Lesson.primaryLanguage", {
                    language: lesson.primaryLanguage,
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
                {lesson.problem.description}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        <LessonSubmissions problemId={lesson.problem.id} />
      </ResizablePanel>

      <ResizableHandle withHandle />
      <ResizablePanel className="flex flex-col gap-4 pl-4" minSize={25}>
        <LessonSubmit
          lessonId={lesson.id}
          locked={lesson.trackSubmitted}
          problemId={lesson.problem.id}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function LessonSubmit({
  lessonId,
  problemId,
  locked,
}: {
  lessonId: string;
  problemId: string;
  locked: boolean;
}) {
  const t = useTranslations("RoadmapPage");
  const tUpload = useTranslations(
    "ContestsPage.Tabs.Problem.Submissions.Upload",
  );
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<Language | null>(null);
  const { theme, systemTheme } = useTheme();
  const { mutate, isPending } = useCreateLessonSubmission();
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
      { lessonId, code, language },
      {
        onError: (error) => {
          toast.error(tUpload("failedSubmit"), { description: error.message });
        },
        onSuccess: () => {
          toast.success(tUpload("submitted"));
          queryClient.invalidateQueries({
            queryKey: ["submissions", "lesson", problemId],
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

function LessonSubmissions({ problemId }: { problemId: string }) {
  const t = useTranslations("RoadmapPage.Lesson");
  const tCommon = useTranslations("ContestsPage.Tabs.Problem.Submissions");
  const { data: submissions, isPending } = useLessonSubmissions(problemId);

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
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
