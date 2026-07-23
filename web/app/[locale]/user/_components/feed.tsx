"use client";

import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { ActivityCard } from "@/components/activity-card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getActivities } from "@/lib/actions/activity/get-activities";

export function Feed({
  userId,
  isOwner,
}: {
  userId: string;
  isOwner: boolean;
}) {
  const t = useTranslations("UserPage.Feed");
  const { data: activities = [], isLoading: loading } = useQuery({
    queryKey: ["activities", userId],
    queryFn: async () => {
      return await getActivities(userId);
    },
  });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 py-6">
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : activities.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageSquare />
            </EmptyMedia>
            <EmptyTitle>
              {isOwner ? t("emptyTitleOwner") : t("emptyTitleVisitor")}
            </EmptyTitle>
            <EmptyDescription>
              {isOwner
                ? t("emptyDescriptionOwner")
                : t("emptyDescriptionVisitor")}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))
      )}
    </div>
  );
}
