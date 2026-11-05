"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useActionErrorMessage } from "@/hooks/use-action-error-message";
import { useCancelSubmission } from "@/hooks/use-cancel-submission";

/**
 * Withdraws a submission no judge has picked up yet. Render it only while
 * the submission is `PENDING`; once the judge claims it the server refuses.
 */
export function CancelSubmissionButton({
  submissionId,
  compact = false,
}: {
  submissionId: string;
  compact?: boolean;
}) {
  const t = useTranslations("SubmissionCancel");
  const errorMessage = useActionErrorMessage();
  const { mutate, isPending } = useCancelSubmission();

  return (
    <Button
      disabled={isPending}
      onClick={() =>
        mutate(submissionId, {
          onError: (error) =>
            toast.error(t("failed"), { description: errorMessage(error) }),
        })
      }
      size={compact ? "icon-sm" : "sm"}
      title={t("hint")}
      type="button"
      variant="outline"
    >
      <X />
      {compact ? <span className="sr-only">{t("cancel")}</span> : t("cancel")}
    </Button>
  );
}
