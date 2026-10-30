"use client";

import { CheckCircle2, CircleSlash, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

/** An example play's advisory comparison: match, mismatch, or no verdict. */
export function MatchBadge({ match }: { match: boolean | null }) {
  const t = useTranslations("Workspace.Console");
  if (match === null) {
    return (
      <span className="flex items-center gap-1 text-muted-foreground">
        <CircleSlash className="size-3.5" />
        {t("finished")}
      </span>
    );
  }
  return match ? (
    <span className="flex items-center gap-1 font-medium text-green-600 dark:text-green-400">
      <CheckCircle2 className="size-3.5" />
      {t("match")}
    </span>
  ) : (
    <span className="flex items-center gap-1 font-medium text-destructive">
      <XCircle className="size-3.5" />
      {t("mismatch")}
    </span>
  );
}
