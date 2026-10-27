"use client";

import { useTranslations } from "next-intl";
import type { JudgeReport, TestCaseResult } from "@/lib/judge-report";

const VERDICT_KEY = {
  wrong_answer: "wrongAnswerOnTest",
  runtime_error: "runtimeErrorOnTest",
  time_limit: "timeLimitOnTest",
  memory_limit: "memoryLimitOnTest",
  judge_error: "judgeErrorOnTest",
} as const;

/** True when the server withheld this failing test's input (hidden test). */
export function isHiddenFailure(f: TestCaseResult): boolean {
  return !!f.redacted && f.input === undefined;
}

/**
 * Shown instead of input/expected/actual when a submission failed a hidden
 * test: the verdict, the test number and the pass count — nothing that
 * depends on the test's data. Compiler output, if any, is still shown.
 */
export function HiddenTestNotice({ report }: { report: JudgeReport }) {
  const t = useTranslations("JudgeReport");
  const f = report.failure_details;
  if (!f) return null;

  const kind = f.failure_kind;
  const verdictKey =
    kind && kind !== "compile_error" ? VERDICT_KEY[kind] : "failedOnTest";

  return (
    <div className="flex flex-col gap-2 w-full text-sm">
      <div className="font-medium text-red-500 flex flex-wrap items-center gap-2">
        <span>{t(verdictKey, { index: f.index })}</span>
        <span className="text-muted-foreground text-xs font-normal">
          {t("passedCount", {
            passed: report.passed_count,
            total: report.total_tests,
          })}
        </span>
      </div>
      {f.error && (
        <pre className="max-h-40 overflow-auto rounded-md border border-red-200 bg-red-50 p-2 font-mono text-xs whitespace-pre-wrap text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {f.error}
        </pre>
      )}
      <p className="text-muted-foreground text-xs">{t("hiddenTestNote")}</p>
    </div>
  );
}
