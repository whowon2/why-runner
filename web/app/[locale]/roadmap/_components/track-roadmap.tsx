"use client";

import {
  CheckCircle2,
  Circle,
  ClipboardList,
  ListChecks,
  Send,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubmitTrack } from "@/hooks/use-submit-track";
import { useTrack } from "@/hooks/use-track";
import { cn } from "@/lib/utils";
import { ManageTrack } from "./manage-track";

export function TrackRoadmap({ trackId }: { trackId: string }) {
  const t = useTranslations("RoadmapPage");
  const tTracks = useTranslations("TracksPage");
  const { data, isPending } = useTrack(trackId);
  const { mutate: submitTrack, isPending: isSubmitting } = useSubmitTrack();

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!data) return null;

  const { track, lessons, isOwner, submittedAt } = data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        action={
          isOwner ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/roadmap/${trackId}/review`}>
                <ClipboardList className="size-3.5" />
                {t("reviewAnswers")}
              </Link>
            </Button>
          ) : undefined
        }
        icon={ListChecks}
        subtitle={track.description || tTracks("defaultSubtitle")}
        title={track.title}
      />

      <div className="flex flex-wrap items-center gap-2">
        {track.dueDate && (
          <Badge className="w-fit" variant="outline">
            {t("dueDatePrefix")} {new Date(track.dueDate).toLocaleDateString()}
          </Badge>
        )}
        {!isOwner &&
          (submittedAt ? (
            <Badge className="w-fit bg-blue-500">
              {t("submittedAt", {
                date: new Date(submittedAt).toLocaleString(),
              })}
            </Badge>
          ) : null)}
      </div>

      {!isOwner && !submittedAt && lessons.length > 0 && (
        <Button
          className="w-fit"
          disabled={isSubmitting}
          onClick={() =>
            submitTrack(trackId, {
              onError: (error: Error) => toast.error(error.message),
              onSuccess: () => toast.success(t("submitTrackSuccess")),
            })
          }
        >
          <LoadingSwap
            className="inline-flex items-center gap-2"
            isLoading={isSubmitting}
          >
            <Send className="size-4" />
            {t("submitTrack")}
          </LoadingSwap>
        </Button>
      )}

      {isOwner && <ManageTrack lessonCount={lessons.length} track={track} />}

      {lessons.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {lessons.map((l, idx) => (
            <Link
              className={cn(
                "flex items-center justify-between gap-2 rounded-md border px-4 py-3 transition-colors hover:bg-muted",
                { "border-green-500/50": l.done },
              )}
              href={`/roadmap/lesson/${l.id}`}
              key={l.id}
            >
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-sm tabular-nums">
                  {idx + 1}.
                </span>
                {l.done ? (
                  <CheckCircle2 className="size-4 text-green-500" />
                ) : (
                  <Circle className="size-4 text-muted-foreground" />
                )}
                <span>{l.problem.title}</span>
              </div>
              {l.primaryLanguage && (
                <Badge variant="outline">{l.primaryLanguage}</Badge>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
