"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader, Rocket } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ShareIconButton } from "@/components/share-icon-button";
import { Button } from "@/components/ui/button";
import type { Problem } from "@/drizzle/schema";
import { usePublishProblem } from "@/hooks/use-publish-problem";
import {
  getMissingProblemFields,
  PUBLISH_MISSING_FIELDS_PREFIX,
  type PublishProblemFieldError,
} from "@/lib/actions/problems/publish-problem-shared";

function parseMissingFields(message: string): PublishProblemFieldError[] {
  if (!message.startsWith(PUBLISH_MISSING_FIELDS_PREFIX)) return [];
  return message
    .slice(PUBLISH_MISSING_FIELDS_PREFIX.length)
    .split(",")
    .filter(Boolean) as PublishProblemFieldError[];
}

export function PublishProblem({ problem }: { problem: Problem }) {
  const t = useTranslations("ProblemsPage.Publish");
  const { mutate: publishProblem, isPending, isSuccess } = usePublishProblem();
  const queryClient = useQueryClient();

  const missing = getMissingProblemFields(problem);

  function handlePublish() {
    publishProblem(problem.id, {
      onError: (error) => {
        const missingFields = parseMissingFields(error.message);
        toast.error(t("failed"), {
          description:
            missingFields.length > 0
              ? missingFields
                  .map((field) => t(`missingField.${field}`))
                  .join(", ")
              : error.message,
        });
      },
      onSuccess: () => {
        toast.success(t("success"));
        queryClient.invalidateQueries({
          queryKey: ["problems", String(problem.id)],
        });
        queryClient.invalidateQueries({ queryKey: ["problems"] });
      },
    });
  }

  return (
    <div className="flex flex-col gap-2 items-start">
      <div className="flex items-center gap-2">
        <Button
          onClick={handlePublish}
          disabled={isPending || missing.length > 0}
        >
          {isPending ? (
            <Loader className="animate-spin" />
          ) : (
            <Rocket className="h-4 w-4" />
          )}
          {t("button")}
        </Button>
        {(isSuccess || problem.status === "published") && (
          <ShareIconButton
            path={`/problems/${problem.slug}`}
            title={problem.title}
          />
        )}
      </div>
      {missing.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {t("missingSummary")}:{" "}
          {missing.map((field) => t(`missingField.${field}`)).join(", ")}
        </p>
      )}
    </div>
  );
}
