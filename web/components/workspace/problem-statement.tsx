"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  DifficultyBadge,
  DraftBadge,
  ProblemTags,
} from "@/app/[locale]/problems/_components/badge";
import { ProblemDescription } from "@/app/[locale]/problems/_components/description";
import type { Language, Problem } from "@/drizzle/schema";

/**
 * Statement column for a problem: badges, limits, then narrative,
 * description and examples (`ProblemDescription`). `children` go below,
 * e.g. an exercise's constraints.
 */
export function ProblemStatement({
  problem,
  allowedLanguages = [],
  children,
}: {
  problem: Pick<
    Problem,
    "id" | "difficulty" | "status" | "tags" | "timeLimitMs" | "memoryLimitMb"
  >;
  /** Contest problem's allowed languages; empty = any (no line shown). */
  allowedLanguages?: Language[];
  children?: ReactNode;
}) {
  const t = useTranslations("Workspace.Status");
  const tAllowed = useTranslations("AllowedLanguages");
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
      {allowedLanguages.length > 0 && (
        <p className="text-muted-foreground text-sm" translate="no">
          {tAllowed("statement", { languages: allowedLanguages.join(", ") })}
        </p>
      )}
      <ProblemDescription problemId={problem.id} />
      {children}
    </div>
  );
}
