"use client";

import { FilePlus2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { toast } from "sonner";
import { CodeEditor } from "@/components/code-editor";
import { LatestVerdict } from "@/components/submissions/latest-verdict";
import {
  type CodeRunner,
  RunButton,
  RunPanel,
  type RunProgram,
} from "@/components/code-run/code-run";
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
import type { Language, Submission } from "@/drizzle/schema";
import { useActionErrorMessage } from "@/hooks/use-action-error-message";
import { useCreateProblemSubmission } from "@/hooks/use-create-problem-submission";
import { useRunsEnabled } from "@/hooks/use-runs-enabled";
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
  latest,
  draftFor,
  clearDraft,
  runner,
}: {
  problemId: string;
  runner: CodeRunner;
  code: string;
  setCode: (code: string) => void;
  language: Language | null;
  setLanguage: (language: Language) => void;
  latest: Submission | undefined;
  draftFor: (language: Language) => string | null;
  clearDraft: (language: Language | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { mutate, isPending } = useCreateProblemSubmission();
  const t = useTranslations("ProblemsPage.Workspace.Submit");
  const tCommon = useTranslations("ToolTips");
  const errorMessage = useActionErrorMessage();
  const starterComments = useStarterComments();
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
      toast.warning(t("selectLanguage"));
      return null;
    }
    if (!code.length) {
      toast.warning(t("emptyCode"));
      return null;
    }
    return language;
  }

  function program(): RunProgram | null {
    const lang = checkProgram();
    if (!lang) return null;
    return { context: "problem", problemId, code, language: lang };
  }

  function handleSubmit() {
    const lang = checkProgram();
    if (!lang) return;

    mutate(
      { code, language: lang, problemId },
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
                onReset={(starter) => {
                  clearDraft(language);
                  setCode(starter);
                }}
                onUndo={setCode}
              />

              <LatestVerdict submission={latest} />
              {runsEnabled && (
                <RunButton
                  onRun={() => runner.run(program())}
                  runner={runner}
                />
              )}

              <Button disabled={isPending} onClick={handleSubmit}>
                <Upload />
                {t("submitButton")}
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
