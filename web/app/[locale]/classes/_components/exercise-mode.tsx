"use client";

import { Blocks, Code2, ListOrdered } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { ExerciseMode, Language } from "@/drizzle/schema";
import {
  useCheckParsonsSolution,
  useExerciseModeState,
  useSetExerciseMode,
} from "@/hooks/use-exercise-mode";
import { cn } from "@/lib/utils";

const LANGUAGES: Language[] = [
  "python",
  "portugol",
  "c",
  "cpp",
  "java",
  "rust",
];

const MODES: { mode: ExerciseMode; icon: typeof Code2 }[] = [
  { mode: "code", icon: Code2 },
  { mode: "blocks", icon: Blocks },
  { mode: "parsons", icon: ListOrdered },
];

// How students answer one exercise entry. Like solution constraints, this is
// per exercise (one problem inside one lesson), never a property of the
// problem itself.
export function ExerciseModePanel({ exerciseId }: { exerciseId: string }) {
  const t = useTranslations("RoadmapPage.Mode");
  const { data, isPending } = useExerciseModeState(exerciseId);
  const setMode = useSetExerciseMode();
  const [selected, setSelected] = useState<ExerciseMode | null>(null);

  if (isPending || !data) return <Skeleton className="h-40 w-full" />;

  const current = selected ?? data.mode;

  function apply(mode: ExerciseMode) {
    setMode.mutate(
      { exerciseId, mode },
      {
        onSuccess: () => toast.success(t("saved")),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-none border p-4">
      <div>
        <h3 className="font-semibold text-lg">{t("title")}</h3>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>

      <div className="flex flex-col gap-2">
        {MODES.map(({ mode, icon: Icon }) => (
          <button
            className={cn(
              "flex items-start gap-3 border p-3 text-left text-sm transition-colors hover:bg-muted/50",
              current === mode && "border-primary bg-muted/50",
            )}
            key={mode}
            onClick={() => setSelected(mode)}
            type="button"
          >
            <Icon className="mt-0.5 size-4 shrink-0" />
            <span className="flex flex-1 flex-col gap-1">
              <span className="font-medium">{t(`${mode}.label`)}</span>
              <span className="text-muted-foreground text-xs">
                {t(`${mode}.hint`)}
              </span>
            </span>
            {data.mode === mode && (
              <span className="shrink-0 text-muted-foreground text-xs">
                {t("current")}
              </span>
            )}
          </button>
        ))}
      </div>

      {current === "parsons" ? (
        <ParsonsSolutionEditor
          exerciseId={exerciseId}
          isApplying={setMode.isPending}
          onApply={() => apply("parsons")}
          state={data}
        />
      ) : (
        <div className="flex justify-end">
          <Button
            disabled={current === data.mode || setMode.isPending}
            onClick={() => apply(current)}
            size="sm"
            type="button"
          >
            {t("apply")}
          </Button>
        </div>
      )}
    </div>
  );
}

function ParsonsSolutionEditor({
  exerciseId,
  state,
  onApply,
  isApplying,
}: {
  exerciseId: string;
  state: NonNullable<ReturnType<typeof useExerciseModeState>["data"]>;
  onApply: () => void;
  isApplying: boolean;
}) {
  const t = useTranslations("RoadmapPage.Mode");
  const check = useCheckParsonsSolution();
  const latest = state.latestParsonsCheck;

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<Language | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Start from the stored solution (or the last checked one) once, without
  // clobbering local edits on background refetches while a check runs.
  useEffect(() => {
    if (hydrated) return;
    setCode(state.parsonsSolution ?? latest?.code ?? "");
    setLanguage(
      latest?.language ??
        (state.mode === "parsons" ? state.primaryLanguage : null),
    );
    setHydrated(true);
  }, [hydrated, latest, state]);

  const isRunning =
    latest?.status === "PENDING" || latest?.status === "RUNNING";
  // Only a passed check of exactly what is in the editor can be applied.
  const canApply =
    state.parsonsCheckPassed &&
    latest?.code === code &&
    latest?.language === language;

  function handleCheck() {
    if (!language) {
      toast.warning(t("parsons.selectLanguage"));
      return;
    }
    check.mutate(
      { exerciseId, code, language },
      { onError: (error) => toast.error(error.message) },
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs">
        {t("parsons.solutionHint")}
      </p>
      <Select
        onValueChange={(v) => setLanguage(v as Language)}
        value={language ?? undefined}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder={t("parsons.languagePlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang} value={lang}>
              {lang}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Textarea
        className="min-h-48 font-mono text-xs"
        onChange={(e) => setCode(e.target.value)}
        placeholder={t("parsons.solutionPlaceholder")}
        spellCheck={false}
        value={code}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ParsonsCheckStatus
          isRunning={isRunning}
          output={latest?.output ?? null}
          status={latest?.status}
          upToDate={latest?.code === code && latest?.language === language}
        />
        <div className="flex gap-2">
          <Button
            disabled={isRunning || check.isPending || !code.trim()}
            onClick={handleCheck}
            size="sm"
            type="button"
            variant="outline"
          >
            {isRunning ? t("parsons.checking") : t("parsons.check")}
          </Button>
          <Button
            disabled={!canApply || isApplying}
            onClick={onApply}
            size="sm"
            type="button"
          >
            {t("apply")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ParsonsCheckStatus({
  status,
  output,
  isRunning,
  upToDate,
}: {
  status: string | undefined;
  output: string | null;
  isRunning: boolean;
  upToDate: boolean;
}) {
  const t = useTranslations("RoadmapPage.Mode.parsons");

  if (!status) return <span className="text-muted-foreground text-xs" />;
  if (isRunning) {
    return (
      <span className="text-muted-foreground text-xs">{t("checking")}</span>
    );
  }
  if (!upToDate) {
    return <span className="text-muted-foreground text-xs">{t("edited")}</span>;
  }
  if (status === "PASSED") {
    return <span className="text-green-600 text-xs">{t("passed")}</span>;
  }

  let error: string | null = null;
  try {
    const report = output ? JSON.parse(output) : null;
    error = report?.failure_details?.error ?? null;
  } catch {
    // Unparseable report: fall back to the generic failure message.
  }
  return (
    <span className="text-destructive text-xs">
      {t("failed")}
      {error ? `: ${error}` : ""}
    </span>
  );
}
