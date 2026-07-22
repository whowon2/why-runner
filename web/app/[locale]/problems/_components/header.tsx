"use client";

import { useTranslations } from "next-intl";
import { useProblem } from "@/hooks/use-problem";
import { DifficultyBadge, DraftBadge } from "./badge";

export function ProblemPageHeader({ problemId }: { problemId: string }) {
  const t = useTranslations("ProblemsPage");
  const { data: problem } = useProblem(problemId);

  if (!problem) return null;

  return (
    <div className="relative flex flex-col items-center justify-center gap-4 mt-6 mb-8 w-full max-w-6xl p-6 rounded-none bg-white/40 dark:bg-neutral-900/40 backdrop-blur-xl border border-white/20 shadow-2xl shadow-indigo-500/5">
      <div className="flex items-center gap-3 flex-wrap justify-center">
        <DifficultyBadge difficulty={problem.difficulty} />
        {problem.status === "draft" && <DraftBadge />}
      </div>

      <h1 className="font-extrabold text-4xl sm:text-5xl text-center tracking-tight text-foreground bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/70">
        {problem.title}
      </h1>

      <div className="flex gap-4 text-muted-foreground text-sm">
        <span>
          {t("Workspace.Task.timeLimit", {
            seconds: problem.timeLimitMs / 1000,
          })}
        </span>
        <span>
          {t("Workspace.Task.memoryLimit", { mb: problem.memoryLimitMb })}
        </span>
      </div>
    </div>
  );
}
