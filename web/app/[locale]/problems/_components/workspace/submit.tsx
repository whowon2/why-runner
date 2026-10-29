"use client";

import { FilePlus2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { toast } from "sonner";
import { CodeEditor } from "@/components/code-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ResetCodeButton,
  useStarterComments,
} from "@/components/reset-code-button";
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
import { useActionErrorMessage } from "@/hooks/use-action-error-message";
import { useCreateProblemSubmission } from "@/hooks/use-create-problem-submission";
import { nextCodeOnLanguageChange } from "@/lib/starter-code";

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
  const t = useTranslations("ProblemsPage.Workspace.Submit");
  const tCommon = useTranslations("ToolTips");
  const errorMessage = useActionErrorMessage();
  const starterComments = useStarterComments();

  function handleLanguageChange(value: string) {
    const next = value as Language;
    setCode(nextCodeOnLanguageChange(code, language, next, starterComments));
    setLanguage(next);
  }

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
          toast.error(t("failedSubmit"), {
            description: errorMessage(error),
          });
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
        <CodeEditor
          height={500}
          language={language || ""}
          onChange={(c) => {
            if (c !== undefined) setCode(c);
          }}
          toolbar={
            <div className="flex justify-between gap-2">
              <Select
                onValueChange={handleLanguageChange}
                value={language ?? undefined}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("languagePlaceholder")} />
                </SelectTrigger>
                <SelectContent className="notranslate" translate="no">
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

              <ResetCodeButton
                code={code}
                language={language}
                onReset={setCode}
                onUndo={setCode}
              />

              <Button disabled={isPending} onClick={handleSubmit}>
                <Upload />
                {t("submitButton")}
              </Button>
            </div>
          }
          value={code}
        />
      </CardContent>
    </Card>
  );
}
