"use client";

import { useTranslations } from "next-intl";
import type { Submission } from "@/drizzle/schema";
import { SubmissionStatus } from "@/drizzle/schema";
import { cn } from "@/lib/utils";

type Status = Submission["status"];

function isKnownStatus(status: string): status is Status {
  return (SubmissionStatus.enumValues as readonly string[]).includes(status);
}

/** Localized label for a `submission.status`; unknown values show raw. */
export function useStatusLabel() {
  const t = useTranslations("SubmissionStatus");
  return (status: string) => (isKnownStatus(status) ? t(status) : status);
}

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const label = useStatusLabel();
  return (
    <span
      className={cn("text-xs font-medium whitespace-nowrap", className)}
      data-status={status}
    >
      {label(status)}
    </span>
  );
}
