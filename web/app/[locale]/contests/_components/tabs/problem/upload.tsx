"use client";

import Editor from "@monaco-editor/react";
import { useQueryClient } from "@tanstack/react-query";
import { FilePlus2, Save, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
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
import type { Contest, Language, ProblemPreview } from "@/drizzle/schema";
import { useActionErrorMessage } from "@/hooks/use-action-error-message";
import { useCreateSubmission } from "@/hooks/use-create-submission";

export function UploadCode({
  problem,
  contest,
}: {
  problem: ProblemPreview;
  contest: Contest;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<Language | null>(null);
  const { mutate, isPending } = useCreateSubmission();
  const { theme, systemTheme } = useTheme();
  const t = useTranslations();
  const tUpload = useTranslations(
    "ContestsPage.Tabs.Problem.Submissions.Upload",
  );
  const tAI = useTranslations("ContestsPage.Tabs.Problem.Submissions.AI");
  const queryClient = useQueryClient();
  const errorMessage = useActionErrorMessage();

  const extensions = {
    c: ["c"],
    cpp: ["cpp", "cc", "cxx", "c++"],
    java: ["java"],
    rust: ["rs"],
    python: ["py"],
    portugol: ["por"],
  };

  function handleUpload() {
    if (!language) {
      toast.warning(tUpload("selectLanguage"));
      return;
    }

    if (!code.length) {
      toast.warning(tUpload("emptyCode"));
      return;
    }

    mutate(
      {
        code,
        contestId: contest.id,
        language,
        problemId: problem.id,
      },
      {
        onError: (error) => {
          toast.error(tUpload("failedSubmit"), {
            description: errorMessage(error),
          });
        },
        onSuccess: () => {
          toast.success(tUpload("submitted"));
          queryClient.invalidateQueries({
            queryKey: ["submissions", String(problem.id)],
          });
          queryClient.invalidateQueries({
            queryKey: ["submissions", { contestId: contest.id }],
          });
        },
      },
    );
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!language || !file) return;

    const extension = file.name.split(".").pop();

    if (
      !extension ||
      !extensions[language as keyof typeof extensions]?.includes(extension)
    ) {
      toast.warning(tUpload("invalidExtension"), {
        description: tUpload("expectedExtensions", {
          extensions:
            extensions[language as keyof typeof extensions].join(", "),
        }),
      });

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

  function handleLanguageChange(value: string) {
    setLanguage(value as Language);
  }

  function handleSaveCode() {
    if (code) {
      localStorage.setItem(`code-${problem.id}-${language}`, code);

      toast.success(tUpload("codeSaved"));
    } else {
      toast.warning(tUpload("noCodeToSave"));
    }
  }

  useEffect(() => {
    if (language) {
      if (!code) {
        const savedCode = localStorage.getItem(
          `code-${problem.id}-${language}`,
        );

        if (savedCode) {
          toast(tUpload("loadSavedPrompt"), {
            action: {
              label: tUpload("load"),
              onClick: () => setCode(savedCode),
            },
            cancel: {
              label: tAI("cancel"),
              onClick: () => {},
            },
            duration: 100000,
          });
        }
      }
    }
  }, [code, problem.id, language, tAI, tUpload]);

  return (
    <Card className="h-full w-full gap-0 bg-transparent border-none py-0 shadow-none">
      <CardContent className="flex h-full min-h-0 w-full flex-col gap-4 px-0">
        <div className="grid w-full items-center gap-1.5">
          <div className="flex justify-between gap-2">
            <Select onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={tUpload("languagePlaceholder")} />
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
              className="hidden w-full"
              onChange={handleFileChange}
              ref={fileRef}
              type="file"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    disabled={!language}
                    onClick={() => {
                      fileRef.current?.click();
                    }}
                    variant={"outline"}
                  >
                    <FilePlus2 />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("ToolTips.open-file")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleSaveCode} variant={"outline"}>
                    <Save />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("ToolTips.save")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button disabled={isPending} onClick={handleUpload}>
                    <Upload />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("ToolTips.upload")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <Editor
            className="rounded-none"
            height={"100%"}
            language={language || ""}
            onChange={(c) => {
              if (c) {
                setCode(c);
              }
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
            width={"100%"}
          />
        </div>
      </CardContent>
    </Card>
  );
}
