"use client";

import Editor from "@monaco-editor/react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2">
      <Card className="bg-transparent shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-bold text-2xl">
            {lesson.problem.title}
            {lesson.completed && (
              <Badge className="bg-green-500">{t("completed")}</Badge>
            )}
            {lesson.locked && <Badge variant="outline">{t("locked")}</Badge>}
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            {lesson.primaryLanguage
              ? t("Lesson.primaryLanguage", {
                  language: lesson.primaryLanguage,
                })
              : t("Lesson.anyLanguage")}
          </p>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap">{lesson.problem.description}</pre>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        {lesson.locked ? (
          <Card className="bg-transparent shadow-none">
            <CardContent className="flex flex-col gap-2">
              <p className="text-sm">{t("Lesson.lockedNotice")}</p>
              <p className="text-muted-foreground text-xs">
                {t("requirementsPrefix")}{" "}
                {lesson.unmetRequirements
                  .map((r) =>
                    r.kind === "theme"
                      ? `${t(`themes.${r.theme}` as Parameters<typeof t>[0])} ${r.minValue} (${r.currentValue})`
                      : `${r.language} ${r.minValue} (${r.currentValue})`,
                  )
                  .join(", ")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <LessonSubmit problemId={lesson.problem.id} />
        )}
        <LessonSubmissions problemId={lesson.problem.id} />
      </div>
    </div>
  );
}

function LessonSubmit({ problemId }: { problemId: string }) {
  const tUpload = useTranslations(
    "ContestsPage.Tabs.Problem.Submissions.Upload",
  );
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<Language | null>(null);
  const { theme, systemTheme } = useTheme();
  const { mutate, isPending } = useCreateLessonSubmission();
  const queryClient = useQueryClient();

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
      { problemId, code, language },
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
          height={300}
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
  const tCommon = useTranslations(
    "ContestsPage.Tabs.Problem.Submissions",
  );
  const { data: submissions, isPending } = useLessonSubmissions(problemId);

  if (isPending) return <Skeleton className="h-32 w-full" />;

  return (
    <Card className="bg-transparent shadow-none">
      <CardHeader>
        <CardTitle>{t("submissionsTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {!submissions || submissions.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {tCommon("noSubmissions")}
          </p>
        ) : (
          submissions.map((s) => (
            <div
              className={cn("flex items-center justify-between rounded-md border px-3 py-2 text-sm", {
                "text-green-500 border-green-500": s.status === "PASSED",
                "text-red-500 border-red-500": s.status === "FAILED",
                "text-orange-500 border-orange-500": s.status === "ERROR",
                "text-gray-500 border-gray-500": s.status === "PENDING",
                "text-blue-500 border-blue-500": s.status === "RUNNING",
              })}
              key={s.id}
            >
              <span>{s.createdAt.toLocaleTimeString()}</span>
              <span className="flex items-center gap-1">
                {s.status === "PASSED" && <CheckCircle2 className="size-4" />}
                {s.language} · {s.status}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
