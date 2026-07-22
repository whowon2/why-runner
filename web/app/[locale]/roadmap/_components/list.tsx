"use client";

import { CheckCircle2, Circle, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoadmap } from "@/hooks/use-roadmap";
import { cn } from "@/lib/utils";
import type { UnmetRequirement } from "@/lib/actions/lessons/lesson-lock";

export function RoadmapList() {
  const t = useTranslations("RoadmapPage");
  const { data: tracks, isPending } = useRoadmap();

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-bold text-3xl">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {!tracks || tracks.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        tracks.map((track) => (
          <Card key={track.theme} className="bg-transparent shadow-none">
            <CardHeader>
              <CardTitle className="text-xl">
                {t(
                  `themes.${track.theme}` as Parameters<typeof t>[0],
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {track.lessons.map((l) => (
                <Link
                  className={cn(
                    "flex flex-col gap-2 rounded-md border px-4 py-3 transition-colors hover:bg-muted",
                    { "border-green-500/50": l.completed },
                    { "opacity-60": l.locked },
                  )}
                  href={`/roadmap/${l.id}`}
                  key={l.id}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {l.locked ? (
                        <Lock className="size-4 text-muted-foreground" />
                      ) : l.completed ? (
                        <CheckCircle2 className="size-4 text-green-500" />
                      ) : (
                        <Circle className="size-4 text-muted-foreground" />
                      )}
                      <span>{l.problem.title}</span>
                    </div>
                    {l.primaryLanguage && (
                      <Badge variant="outline">{l.primaryLanguage}</Badge>
                    )}
                  </div>
                  {l.locked && (
                    <p className="text-muted-foreground text-xs">
                      {t("requirementsPrefix")}{" "}
                      {l.unmetRequirements
                        .map((r: UnmetRequirement) =>
                          r.kind === "theme"
                            ? `${t(`themes.${r.theme}` as Parameters<typeof t>[0])} ${r.minValue} (${r.currentValue})`
                            : `${r.language} ${r.minValue} (${r.currentValue})`,
                        )
                        .join(", ")}
                    </p>
                  )}
                  {!l.completed && !l.locked && l.rewards.themes.length > 0 && (
                    <p className="text-muted-foreground text-xs">
                      {t("rewardsPrefix")}{" "}
                      {l.rewards.themes
                        .map(
                          (theme) =>
                            `+1 ${t(
                              `themes.${theme}` as Parameters<typeof t>[0],
                            )}`,
                        )
                        .join(", ")}
                    </p>
                  )}
                </Link>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
