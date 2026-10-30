"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  DifficultyBadge,
  DraftBadge,
  ProblemTags,
} from "@/app/[locale]/problems/_components/badge";
import { ProblemDescription } from "@/app/[locale]/problems/_components/description";
import type { Problem } from "@/drizzle/schema";

/**
 * Statement column for a problem: badges, limits, then narrative,
 * description and examples (`ProblemDescription`). `children` go below,
 * e.g. an exercise's constraints.
 */
export function ProblemStatement({
  problem,
  children,
}: {
  problem: Pick<
    Problem,
    "id" | "difficulty" | "status" | "tags" | "timeLimitMs" | "memoryLimitMb"
  >;
  children?: ReactNode;
}) {
  const t = useTranslations("Workspace.Status");
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <DifficultyBadge difficulty={problem.difficulty} />
        {problem.status === "draft" && <DraftBadge />}
        <ProblemTags tags={problem.tags} />
        <span className="ml-auto text-muted-foreground text-xs">
          {t("limits", {
            seconds: problem.timeLimitMs / 1000,
            mb: problem.memoryLimitMb,
          })}
        </span>
      </div>
      <ProblemDescription problemId={problem.id} />
      {children}
    </div>
  );
}
