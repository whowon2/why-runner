"use client";

import { useQuery } from "@tanstack/react-query";
import { Flame, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { ActivityCard } from "@/components/activity-card";
import { Separator } from "@/components/ui/separator";
import { getActivities } from "@/lib/actions/activity/get-activities";

export function Feed({ userId }: { userId: string }) {
  const t = useTranslations("UserPage.Feed");
  const { data: activities = [], isLoading: loading } = useQuery({
    queryKey: ["activities", userId],
    queryFn: async () => {
      return await getActivities(userId);
    },
  });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-neutral-900 to-neutral-500 dark:from-neutral-50 dark:to-neutral-400">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-lg">{t("subtitle")}</p>
        </div>
      </div>

      <Separator className="w-full h-px bg-linear-to-r from-border to-transparent" />

      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))
        )}

        <div className="flex flex-col items-center justify-center pt-8 pb-12 text-muted-foreground space-y-3">
          <div className="p-4 rounded-none bg-muted/30">
            <Flame className="w-8 h-8 text-orange-500/70" />
          </div>
          <p className="text-sm font-medium">{t("caughtUp")}</p>
        </div>
      </div>
    </div>
  );
}
