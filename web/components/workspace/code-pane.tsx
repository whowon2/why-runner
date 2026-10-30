"use client";

import { FilePlus2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CodeEditor } from "@/components/code-editor";
import {
  ResetCodeButton,
  useStarterComments,
} from "@/components/reset-code-button";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Language } from "@/drizzle/schema";
import { useCodeDraft } from "@/hooks/use-code-draft";
import type { DraftTarget } from "@/lib/code-draft";
import { nextCodeOnLanguageChange } from "@/lib/starter-code";
import { useWorkspace } from "./workspace-context";

const EXTENSIONS: Record<Language, string[]> = {
  c: ["c"],
  cpp: ["cpp", "cc", "cxx", "c++"],
  java: ["java"],
  rust: ["rs"],
  python: ["py"],
  portugol: ["por"],
};

/**
 * The workspace's Monaco editor: language, open file, reset and maximize on
 * top; drafts per user/target/language through `useCodeDraft`. Registers its
 * answer with the workspace so Run / Play / Submit read the current code.
 */
export function CodePane({ draftTarget }: { draftTarget: DraftTarget }) {
  const t = useTranslations("Workspace.Editor");
  const tUpload = useTranslations(
    "ContestsPage.Tabs.Problem.Submissions.Upload",
  );
  const {
    source,
    registerAnswer,
    setLanguage: shareLanguage,
    maximized,
    setMaximized,
  } = useWorkspace();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<Language | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const starterComments = useStarterComments();
  const { draftFor, clearDraft } = useCodeDraft({
    target: draftTarget,
    code,
    setCode,
    language,
    setLanguage,
    latest: source.submissions?.[0],
  });

  const current = useRef({ code, language });
  current.current = { code, language };

  useEffect(() => shareLanguage(language), [language, shareLanguage]);

  useEffect(() => {
    registerAnswer({
      getAnswer: () => {
        const { code, language } = current.current;
        if (!language) {
          toast.warning(tUpload("selectLanguage"));
          return null;
        }
        if (!code.trim()) {
          toast.warning(tUpload("emptyCode"));
          return null;
        }
        return { mode: "code", language, code };
      },
      load: (lang, value) => {
        setLanguage(lang);
        setCode(value);
      },
    });
    return () => registerAnswer(null);
  }, [registerAnswer, tUpload]);

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

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!language || !file) return;
    const extension = file.name.split(".").pop();
    if (!extension || !EXTENSIONS[language].includes(extension)) {
      toast.warning(tUpload("invalidExtension"), {
        description: tUpload("expectedExtensions", {
          extensions: EXTENSIONS[language].join(", "),
        }),
      });
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCode(reader.result as string);
    reader.readAsText(file);
  }

  return (
    <CodeEditor
      className="h-full min-h-0"
      language={language || ""}
      maximized={maximized}
      onChange={(c) => setCode(c ?? "")}
      onMaximizedChange={setMaximized}
      toolbar={
        <div className="flex items-center gap-2">
          <Select
            onValueChange={handleLanguageChange}
            value={language ?? undefined}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder={tUpload("languagePlaceholder")} />
            </SelectTrigger>
            <SelectContent className="notranslate" translate="no">
              {Language.enumValues.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            className="hidden"
            onChange={handleFileChange}
            ref={fileRef}
            type="file"
          />
          <Button
            aria-label={t("openFile")}
            disabled={!language}
            onClick={() => fileRef.current?.click()}
            size="icon"
            title={t("openFile")}
            variant="ghost"
          >
            <FilePlus2 />
          </Button>
          <ResetCodeButton
            code={code}
            language={language}
            onReset={(starter) => {
              clearDraft(language);
              setCode(starter);
            }}
            onUndo={setCode}
          />
        </div>
      }
      value={code}
    />
  );
}
