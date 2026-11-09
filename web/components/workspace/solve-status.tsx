"use client";

import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Submission } from "@/drizzle/schema";

/** Top-bar summary of the viewer's own submissions: solved / tried / none. */
export function SolveStatus({
  submissions,
}: {
  submissions: Pick<Submission, "status">[] | undefined;
}) {
  const t = useTranslations("Workspace.Status");
  if (!submissions) return null;
  if (submissions.some((s) => s.status === "PASSED")) {
    return (
      <span className="flex items-center gap-1.5 font-medium text-success">
        <CheckCircle2 className="size-4" />
        {t("solved")}
      </span>
    );
  }
  // A canceled submission was never judged: not an attempt.
  return submissions.some((s) => s.status !== "CANCELED") ? (
    <span className="flex items-center gap-1.5 text-warning">
      <CircleDot className="size-4" />
      {t("attempted")}
    </span>
  ) : (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <Circle className="size-4" />
      {t("notAttempted")}
    </span>
  );
}
