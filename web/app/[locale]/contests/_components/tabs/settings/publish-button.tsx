"use client";

import { Loader, Rocket } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import type { Contest } from "@/drizzle/schema";
import { usePublishContest } from "@/hooks/use-publish-contest";
import {
  PUBLISH_MISSING_FIELDS_PREFIX,
  type PublishContestFieldError,
} from "@/lib/actions/contest/publish-contest-shared";

function parseMissingFields(message: string): PublishContestFieldError[] {
  if (!message.startsWith(PUBLISH_MISSING_FIELDS_PREFIX)) return [];
  return message
    .slice(PUBLISH_MISSING_FIELDS_PREFIX.length)
    .split(",")
    .filter(Boolean) as PublishContestFieldError[];
}

export function PublishContest({
  contest,
}: {
  contest: Contest & { problems: unknown[] };
}) {
  const t = useTranslations("ContestsPage.Tabs.Settings.Publish");
  const { mutate: publishContest, isPending } = usePublishContest();
  const queryClient = useQueryClient();

  const missing: PublishContestFieldError[] = [];
  if (!contest.name.trim()) missing.push("name");
  if (!contest.startDate || contest.startDate <= new Date())
    missing.push("startDate");
  if (
    !contest.endDate ||
    (contest.startDate && contest.endDate <= contest.startDate)
  )
    missing.push("endDate");
  if (contest.problems.length === 0) missing.push("problems");

  function handlePublish() {
    publishContest(contest.id, {
      onError: (error) => {
        const missingFields = parseMissingFields(error.message);
        toast.error(t("failed"), {
          description:
            missingFields.length > 0
              ? missingFields.map((field) => t(`missingField.${field}`)).join(", ")
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
      <Button onClick={handlePublish} disabled={isPending || missing.length > 0}>
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
  );
}
