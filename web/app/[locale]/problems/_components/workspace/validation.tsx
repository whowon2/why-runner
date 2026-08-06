"use client";

import {
  Brain,
  CheckCircle2,
  CircleDashed,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
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
import type { Language } from "@/drizzle/schema";
import { useGenerateReferenceSolution } from "@/hooks/use-generate-reference-solution";
import { useProblemValidation } from "@/hooks/use-problem-validation";
import { useTriggerProblemValidation } from "@/hooks/use-trigger-problem-validation";
import { useUpdateProblemReferenceSolution } from "@/hooks/use-update-problem-reference-solution";

interface JudgeReport {
  passed: boolean;
  total_tests: number;
  passed_count: number;
  failure_details?: {
    input: string;
    expected: string;
    actual: string;
    error?: string | null;
    index: number;
  };
}

export function ProblemValidationPanel({ problemId }: { problemId: string }) {
  const t = useTranslations("ProblemsPage.Create.Validation");
  const { data, isPending: isLoadingState } = useProblemValidation(problemId);
  const { mutate: saveReference, isPending: isSaving } =
    useUpdateProblemReferenceSolution();
  const { mutate: triggerValidation, isPending: isTriggering } =
    useTriggerProblemValidation();
  const { mutate: generateReference, isPending: isGenerating } =
    useGenerateReferenceSolution();

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<Language | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Load the persisted reference solution once, without clobbering local
  // edits on every background refetch.
  useEffect(() => {
    if (hydrated || !data) return;
    setCode(data.reference?.code ?? "");
    setLanguage((data.reference?.language as Language | null) ?? null);
    setHydrated(true);
  }, [data, hydrated]);

  const report = useMemo<JudgeReport | null>(() => {
    if (!data?.latest?.output) return null;
    try {
      return JSON.parse(data.latest.output) as JudgeReport;
    } catch {
      return null;
    }
  }, [data?.latest?.output]);

  const status = data?.latest?.status;
  const isRunning = status === "PENDING" || status === "RUNNING";

  function handleValidate() {
    if (!language) {
      toast.warning(t("selectLanguage"));
      return;
    }
    if (!code.trim()) {
      toast.warning(t("emptyCode"));
      return;
    }

    saveReference(
      { problemId, code, language },
      {
        onError: (error) => {
          toast.error(t("saveFailed"), { description: error.message });
        },
        onSuccess: () => {
          triggerValidation(problemId, {
            onError: (error) => {
              toast.error(t("failed"), { description: error.message });
            },
          });
        },
      },
    );
  }

  function handleGenerate() {
    if (!language) {
      toast.warning(t("selectLanguage"));
      return;
    }

    generateReference(
      { problemId, language },
      {
        onError: (error) => {
          toast.error(t("generateFailed"), { description: error.message });
        },
        onSuccess: (generated) => {
          setCode(generated);
        },
      },
    );
  }

  if (isLoadingState) {
    return <Skeleton className="h-40 w-full" />;
  }

  return (
    <div className="flex flex-col gap-4 rounded-none border p-4">
      <div>
        <h3 className="font-semibold text-lg">{t("title")}</h3>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          onValueChange={(v) => setLanguage(v as Language)}
          value={language ?? undefined}
        >
          <SelectTrigger className="w-full max-w-[200px]">
            <SelectValue placeholder={t("selectLanguage")} />
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
        <Button
          disabled={!language || isGenerating}
          onClick={handleGenerate}
          type="button"
          variant="outline"
        >
          <Brain className="h-4 w-4" />
          {isGenerating ? t("generating") : t("generateWithAi")}
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">{t("generateUsesSaved")}</p>

      <Textarea
        className="min-h-[180px] font-mono text-sm"
        onChange={(e) => setCode(e.target.value)}
        placeholder={t("codePlaceholder")}
        value={code}
      />

      <div className="flex items-center gap-3">
        <Button
          disabled={isSaving || isTriggering || isRunning}
          onClick={handleValidate}
          type="button"
        >
          {isRunning ? t("running") : t("validate")}
        </Button>
        <ValidationStatusBadge
          isStale={data?.isStale ?? true}
          report={report}
          status={status}
        />
      </div>

      {report && status === "FAILED" && report.failure_details && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <span className="text-muted-foreground text-xs font-semibold">
              {t("expected")}
            </span>
            <pre className="mt-1 max-h-40 overflow-auto rounded-md border bg-muted/50 p-2 font-mono text-xs whitespace-pre-wrap">
              {report.failure_details.expected}
            </pre>
          </div>
          <div>
            <span className="text-muted-foreground text-xs font-semibold">
              {t("actual")}
            </span>
            <pre className="mt-1 max-h-40 overflow-auto rounded-md border bg-muted/50 p-2 font-mono text-xs whitespace-pre-wrap">
              {report.failure_details.actual || t("noOutput")}
            </pre>
          </div>
          {report.failure_details.error && (
            <div className="md:col-span-2">
              <span className="text-muted-foreground text-xs font-semibold">
                {t("error")}
              </span>
              <pre className="mt-1 max-h-40 overflow-auto rounded-md border bg-muted/50 p-2 font-mono text-xs whitespace-pre-wrap">
                {report.failure_details.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ValidationStatusBadge({
  status,
  isStale,
  report,
}: {
  status: string | undefined;
  isStale: boolean;
  report: JudgeReport | null;
}) {
  const t = useTranslations("ProblemsPage.Create.Validation");

  if (!status) {
    return (
      <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
        <CircleDashed className="h-4 w-4" />
        {t("neverRun")}
      </span>
    );
  }

  if (status === "PENDING" || status === "RUNNING") {
    return (
      <span className="flex items-center gap-1.5 text-blue-500 text-sm">
        <CircleDashed className="h-4 w-4 animate-spin" />
        {t("running")}
      </span>
    );
  }

  if (status === "PASSED" && !isStale) {
    return (
      <span className="flex items-center gap-1.5 text-green-600 text-sm">
        <CheckCircle2 className="h-4 w-4" />
        {t("passed")}
      </span>
    );
  }

  if (status === "PASSED" && isStale) {
    return (
      <span className="flex items-center gap-1.5 text-orange-500 text-sm">
        <TriangleAlert className="h-4 w-4" />
        {t("stale")}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-red-500 text-sm">
      <XCircle className="h-4 w-4" />
      {report
        ? t("failedWithCount", {
            passed: report.passed_count,
            total: report.total_tests,
          })
        : t("errored")}
    </span>
  );
}
