"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, FilePlus2, Save, Upload } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ResetCodeButton,
  useStarterComments,
} from "@/components/reset-code-button";
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
import { getStarterCode } from "@/lib/starter-code";
import { cn } from "@/lib/utils";

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
  // When the code was last written to localStorage (manual or on blur), and
  // whether to flash the save button's "saved" state.
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const justSavedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Monaco's blur listener is registered once on mount, so it reads the
  // latest values through refs instead of a stale closure.
  const codeRef = useRef(code);
  codeRef.current = code;
  const format = useFormatter();
  const { mutate, isPending } = useCreateSubmission();
  const { theme, systemTheme } = useTheme();
  const t = useTranslations();
  const tUpload = useTranslations(
    "ContestsPage.Tabs.Problem.Submissions.Upload",
  );
  const tAI = useTranslations("ContestsPage.Tabs.Problem.Submissions.AI");
  const queryClient = useQueryClient();
  const errorMessage = useActionErrorMessage();
  const starterComments = useStarterComments();
  const starterCommentsRef = useRef(starterComments);
  starterCommentsRef.current = starterComments;

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

  // Every problem + language pair has its own localStorage slot, so each
  // language's version of each problem is kept separately.
  const slotKey = language ? `code-${problem.id}-${language}` : null;
  const slotKeyRef = useRef(slotKey);
  slotKeyRef.current = slotKey;
  const resetSlotKeyRef = useRef<string | null>(null);

  // The slot's language is the last segment of its key.
  function slotStarter(key: string): string {
    const slotLanguage = key.slice(key.lastIndexOf("-") + 1) as Language;
    return getStarterCode(slotLanguage, starterCommentsRef.current);
  }

  // Returns whether anything was written: empty code or the untouched
  // starter never overwrites a saved version, and unchanged code is not
  // rewritten.
  function writeSlot(key: string, value: string): boolean {
    if (!value || value === slotStarter(key)) return false;
    try {
      if (localStorage.getItem(key) === value) return false;
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  function readSlot(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function markSaved() {
    setSavedAt(new Date());
    setJustSaved(true);
    if (justSavedTimer.current) clearTimeout(justSavedTimer.current);
    justSavedTimer.current = setTimeout(() => setJustSaved(false), 2000);
  }

  // Resetting also drops the saved version, so a reload shows the starter.
  // Undo only applies while the same slot is still open.
  function handleReset(starter: string) {
    const key = slotKey;
    if (key) {
      try {
        localStorage.removeItem(key);
      } catch {}
    }
    resetSlotKeyRef.current = key;
    setSavedAt(null);
    setCode(starter);
  }

  function handleUndoReset(previous: string) {
    if (slotKeyRef.current === resetSlotKeyRef.current) setCode(previous);
  }

  function handleSaveCode() {
    if (!code) {
      toast.warning(tUpload("noCodeToSave"));
      return;
    }
    if (!slotKey) {
      toast.warning(tUpload("selectLanguage"));
      return;
    }
    writeSlot(slotKey, code);
    markSaved();
    toast.success(tUpload("codeSaved"));
  }

  const handleEditorMount: OnMount = (editor) => {
    editor.onDidBlurEditorText(() => {
      const key = slotKeyRef.current;
      if (key && writeSlot(key, codeRef.current)) markSaved();
    });
  };

  // Switching problem or language: save the editor into the slot being left,
  // then show the saved version of the slot being entered (or the starter).
  // The component is not remounted per problem, so without this the previous
  // slot's code would stay in the editor and be saved over the new slot.
  const prevSlotKeyRef = useRef(slotKey);
  useEffect(() => {
    const prev = prevSlotKeyRef.current;
    prevSlotKeyRef.current = slotKey;
    if (prev === slotKey) return;

    if (prev) writeSlot(prev, codeRef.current);
    setSavedAt(null);
    setJustSaved(false);
    if (!slotKey) return;

    const stored = readSlot(slotKey);

    // Code typed before any language was chosen belongs to no slot yet: keep
    // it, and only offer the saved version instead of silently replacing it.
    if (!prev && codeRef.current) {
      if (stored && stored !== codeRef.current) {
        toast(tUpload("loadSavedPrompt"), {
          action: {
            label: tUpload("load"),
            onClick: () => setCode(stored),
          },
          cancel: {
            label: tAI("cancel"),
            onClick: () => {},
          },
          duration: 100000,
        });
      }
      return;
    }

    setCode(stored ?? slotStarter(slotKey));
  }, [slotKey, tAI, tUpload]);

  // Closing or reloading the tab doesn't blur the editor; save then too.
  useEffect(() => {
    function onPageHide() {
      const key = slotKeyRef.current;
      if (key) writeSlot(key, codeRef.current);
    }
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      if (justSavedTimer.current) clearTimeout(justSavedTimer.current);
    };
  }, []);

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
                  <Button
                    className={cn(
                      "transition-colors",
                      justSaved &&
                        "border-green-500 text-green-600 dark:text-green-500",
                    )}
                    onClick={handleSaveCode}
                    variant={"outline"}
                  >
                    {justSaved ? (
                      <Check className="animate-in zoom-in-50 fade-in duration-300" />
                    ) : (
                      <Save />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("ToolTips.save")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <ResetCodeButton
              code={code}
              language={language}
              onReset={handleReset}
              onUndo={handleUndoReset}
            />

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
          <p
            aria-live="polite"
            className={cn(
              "h-4 text-muted-foreground text-xs transition-opacity",
              savedAt ? "opacity-100" : "opacity-0",
            )}
          >
            {savedAt &&
              tUpload("savedLocallyAt", {
                time: format.dateTime(savedAt, {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              })}
          </p>
        </div>
        <div className="min-h-0 flex-1">
          <Editor
            className="rounded-none"
            height={"100%"}
            language={language || ""}
            onMount={handleEditorMount}
            onChange={(c) => setCode(c ?? "")}
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
