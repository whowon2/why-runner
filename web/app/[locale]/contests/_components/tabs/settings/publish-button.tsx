"use client";

import { Rocket } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ShareIconButton } from "@/components/share-icon-button";
import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import type { Contest } from "@/drizzle/schema";
import { usePublishContest } from "@/hooks/use-publish-contest";
import {
  PUBLISH_MISSING_FIELDS,
  type PublishContestFieldError,
} from "@/lib/actions/contest/publish-contest-shared";
import { isActionError } from "@/lib/action-result";

export function PublishContest({
  contest,
}: {
  contest: Contest & { problems: unknown[] };
}) {
  const t = useTranslations("ContestsPage.Tabs.Settings.Publish");
  const { mutate: publishContest, isPending, isSuccess } = usePublishContest();
  const queryClient = useQueryClient();

  const missing: PublishContestFieldError[] = [];
  if (!contest.name.trim()) missing.push("name");
  if (!contest.startDate) missing.push("startDate");
  else if (contest.startDate <= new Date()) missing.push("startDatePast");
  if (
    !contest.endDate ||
    (contest.startDate && contest.endDate <= contest.startDate)
  )
    missing.push("endDate");
  if (contest.problems.length === 0) missing.push("problems");

  function handlePublish() {
    publishContest(contest.id, {
      onError: (error) => {
        const missingFields = isActionError(error, PUBLISH_MISSING_FIELDS)
          ? (error.params?.fields as PublishContestFieldError[])
          : [];
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
          queryKey: ["contest", String(contest.id)],
        });
        queryClient.invalidateQueries({ queryKey: ["contests"] });
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
          <LoadingSwap
            isLoading={isPending}
            className="inline-flex items-center gap-2"
          >
            <Rocket className="h-4 w-4" />
            {t("button")}
          </LoadingSwap>
        </Button>
        {(isSuccess || contest.status === "published") && (
          <ShareIconButton
            path={`/contests/${contest.slug}`}
            title={contest.name}
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
