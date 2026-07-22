"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader, Rocket } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Problem } from "@/drizzle/schema";
import { usePublishProblem } from "@/hooks/use-publish-problem";
import { useRouter } from "@/i18n/navigation";
import { createActivity } from "@/lib/actions/activity/create-activity";
import {
  getMissingProblemFields,
  PUBLISH_MISSING_FIELDS_PREFIX,
  type PublishProblemFieldError,
} from "@/lib/actions/problems/publish-problem-shared";
import { ShareToFeedModal } from "@/components/share-to-feed-modal";

function parseMissingFields(message: string): PublishProblemFieldError[] {
  if (!message.startsWith(PUBLISH_MISSING_FIELDS_PREFIX)) return [];
  return message
    .slice(PUBLISH_MISSING_FIELDS_PREFIX.length)
    .split(",")
    .filter(Boolean) as PublishProblemFieldError[];
}

export function PublishProblem({ problem }: { problem: Problem }) {
  const t = useTranslations("ProblemsPage.Publish");
  const tCreate = useTranslations("ProblemsPage.Create");
  const { mutate: publishProblem, isPending } = usePublishProblem();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [showShareModal, setShowShareModal] = useState(false);

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
        setShowShareModal(true);
      },
    });
  }

  return (
    <>
      <div className="flex flex-col gap-2 items-start">
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
        {missing.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {t("missingSummary")}:{" "}
            {missing.map((field) => t(`missingField.${field}`)).join(", ")}
          </p>
        )}
      </div>

      <ShareToFeedModal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          router.push(`/problems/${problem.slug}`);
        }}
        onShare={async (description) => {
          await createActivity({
            type: "PROBLEM_CREATED",
            description,
            problemId: problem.id,
          });
          toast.success(tCreate("sharedToFeed"));
          setShowShareModal(false);
          router.push(`/problems/${problem.slug}`);
        }}
        title={tCreate("shareTitle")}
        descriptionText={tCreate("shareDescription", { title: problem.title })}
      />
    </>
  );
}
