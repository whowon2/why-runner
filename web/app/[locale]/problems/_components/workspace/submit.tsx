"use client";

import Editor from "@monaco-editor/react";
import { FilePlus2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Language } from "@/drizzle/schema";
import { useCreateProblemSubmission } from "@/hooks/use-create-problem-submission";

const EXTENSIONS: Record<Language, string[]> = {
  c: ["c"],
  cpp: ["cpp", "cc", "cxx", "c++"],
  java: ["java"],
  rust: ["rs"],
  python: ["py"],
  portugol: ["por"],
};

export function ProblemSubmitTab({
  problemId,
  code,
  setCode,
  language,
  setLanguage,
}: {
  problemId: string;
  code: string;
  setCode: (code: string) => void;
  language: Language | null;
  setLanguage: (language: Language) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { mutate, isPending } = useCreateProblemSubmission();
  const { theme, systemTheme } = useTheme();
  const t = useTranslations("ProblemsPage.Workspace.Submit");
  const tCommon = useTranslations("ToolTips");

  function handleSubmit() {
    if (!language) {
      toast.warning(t("selectLanguage"));
      return;
    }

    if (!code.length) {
      toast.warning(t("emptyCode"));
      return;
    }

    mutate(
      { code, language, problemId },
      {
        onError: (error) => {
          toast.error(t("failedSubmit"), { description: error.message });
        },
        onSuccess: () => {
          toast.success(t("submitted"));
        },
      },
    );
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!language || !file) return;

    const extension = file.name.split(".").pop();

    if (!extension || !EXTENSIONS[language].includes(extension)) {
      if (fileRef.current) {
        fileRef.current.value = "";
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCode(reader.result as string);
    };
    reader.readAsText(file);
  }

  return (
    <Card className="w-full bg-transparent border-none shadow-none">
      <CardContent className="flex h-full w-full flex-col gap-4">
        <div className="flex justify-between gap-2">
          <Select
            onValueChange={(v) => setLanguage(v as Language)}
            value={language ?? undefined}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("languagePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rust">rust</SelectItem>
              <SelectItem value="cpp">cpp</SelectItem>
              <SelectItem value="c">c</SelectItem>
              <SelectItem value="java">java</SelectItem>
              <SelectItem value="python">python</SelectItem>
              <SelectItem value="portugol">portugol</SelectItem>
            </SelectContent>
          </Select>

          <Input
            className="hidden"
            onChange={handleFileChange}
            ref={fileRef}
            type="file"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  disabled={!language}
                  onClick={() => fileRef.current?.click()}
                  variant="outline"
                >
                  <FilePlus2 />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{tCommon("open-file")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button disabled={isPending} onClick={handleSubmit}>
            <Upload />
            {t("submitButton")}
          </Button>
        </div>

        <Editor
          className="rounded-none"
          height={500}
          language={language || ""}
          onChange={(c) => {
            if (c !== undefined) setCode(c);
          }}
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
