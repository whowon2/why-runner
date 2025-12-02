"use client";

import Editor from "@monaco-editor/react";
import { useQueryClient } from "@tanstack/react-query";
import type { Session } from "better-auth";
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
import { useCreateSubmission } from "@/hooks/use-create-submission";
import type { Contest, Language, Problem } from "@/lib/db/schema";

export function UploadCode({
  session,
  problem,
  contest,
  problemLetter,
}: {
  session: Session;
  problem: Problem;
  contest: Contest;
  problemLetter: string;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<Language | null>(null);
  const { mutate, isPending } = useCreateSubmission();
  const { theme, systemTheme } = useTheme();
  const t = useTranslations();
  const queryClient = useQueryClient();

  const extensions = {
    c: ["c"],
    cpp: ["cpp", "cc", "cxx", "c++"],
    java: ["java"],
    rust: ["rs"],
    python: ["py"],
  };

  function handleUpload() {
    if (!language) {
      toast.warning("Please select a language");
      return;
    }

    if (!code.length) {
      toast.warning("You can't submit empty code");
      return;
    }

    console.log(code.trim().length);

    mutate(
      {
        code,
        contestId: contest.id,
        language,
        problemId: problem.id,
        questionLetter: problemLetter,
        userId: session.userId,
      },
      {
        onError: (error) => {
          toast.error("Failed to submit code", { description: error.message });
        },
        onSuccess: () => {
          toast.success("Code Submitted");
          queryClient.invalidateQueries({
            queryKey: ["submissions", String(problem.id)],
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
      toast.warning("Invalid file extension", {
        description: `Expected: ${extensions[language as keyof typeof extensions].join(", ")}`,
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

      toast.success("Code saved successfully!");
    } else {
      toast.warning("No code to save!");
    }
  }

  useEffect(() => {
    if (language) {
      if (!code) {
        const savedCode = localStorage.getItem(
          `code-${problem.id}-${language}`,
        );

        if (savedCode) {
          toast("Do you want to load the saved code?", {
            action: {
              label: "Load",
              onClick: () => setCode(savedCode),
            },
            cancel: {
              label: "Cancel",
              onClick: () => {},
            },
            duration: 100000,
          });
        }
      }
    }
  }, [code, problem.id, language]);

  return (
    <Card className="h-full max-h-screen w-full bg-transparent border-none shadow-none">
      <CardContent className="flex h-full w-full flex-col gap-4">
        <div className="grid w-full items-center gap-1.5">
          <div className="flex justify-between gap-2">
            <Select onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rust">rust</SelectItem>
                <SelectItem value="cpp">cpp</SelectItem>
                <SelectItem value="c">c</SelectItem>
                <SelectItem value="java">java</SelectItem>
                <SelectItem value="python">python</SelectItem>
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
        <Editor
          className="rounded"
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
      </CardContent>
    </Card>
  );
}
