"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Code2,
  Flame,
  Heart,
  Loader2,
  MessageSquare,
  Share2,
  Trophy,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getActivities } from "@/lib/actions/activity/get-activities";

export function Feed() {
  const t = useTranslations("UserPage.Feed");
  const { data: activities = [], isLoading: loading } = useQuery({
    queryKey: ["activities"],
    queryFn: async () => {
      return await getActivities();
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
          activities.map((activity) => {
            const isContest = activity.type === "CONTEST_CREATED";
            const isProblem = activity.type === "PROBLEM_CREATED";
            const title = isContest
              ? activity.contest?.name
              : isProblem
                ? t("newProblem")
                : t("activity");
            const targetName = isProblem ? activity.problem?.title : "";
            const authorText = `${t("authoredBy")} ${activity.user?.name || t("someone")}`;

            return (
              <Card
                key={activity.id}
                className="hover:shadow-md transition-shadow overflow-hidden group"
              >
                <div
                  className={`h-1.5 w-full bg-linear-to-r ${isContest ? "from-indigo-500 to-cyan-500" : "from-emerald-500 to-teal-500"}`}
                />
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 pt-6">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 transition-colors ${isContest ? "bg-indigo-500/10 group-hover:bg-indigo-500/20" : "bg-emerald-500/10 group-hover:bg-emerald-500/20"}`}
                  >
                    {isContest ? (
                      <Trophy className="h-6 w-6 text-indigo-500" />
                    ) : (
                      <Code2 className="h-6 w-6 text-emerald-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl">{title}</CardTitle>
                    <CardDescription className="text-sm mt-1 font-medium text-muted-foreground">
                      <span
                        className={
                          isContest
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }
                      >
                        {isContest ? t("newContest") : t("newProblem")}
                      </span>{" "}
                      • {new Date(activity.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-5 bg-muted/30 rounded-xl border leading-relaxed text-[15px] dark:text-gray-300">
                    <div className="mb-2 text-sm text-muted-foreground">
                      {authorText}
                    </div>
                    {activity.description && (
                      <p className="mb-3 italic opacity-90">
                        "{activity.description}"
                      </p>
                    )}
                    {isProblem && (
                      <div>
                        {t("problem")}{" "}
                        <span className="font-bold px-2 py-1 bg-background rounded-md border ml-1 shadow-sm">
                          {targetName}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center bg-muted/10 px-6 py-4 border-t">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 rounded-full px-4"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      {t("like")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 dark:hover:text-blue-400 rounded-full px-4"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {t("discuss")}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground rounded-full"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        )}

        <div className="flex flex-col items-center justify-center pt-8 pb-12 text-muted-foreground space-y-3">
          <div className="p-4 rounded-full bg-muted/30">
            <Flame className="w-8 h-8 text-orange-500/70" />
          </div>
          <p className="text-sm font-medium">{t("caughtUp")}</p>
        </div>
      </div>
    </div>
  );
}
