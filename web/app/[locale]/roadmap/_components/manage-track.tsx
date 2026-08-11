"use client";

import { Plus, Rocket } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSwap } from "@/components/ui/loading-swap";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LessonTrack } from "@/drizzle/schema";
import { useCreateLessonEntry } from "@/hooks/use-lesson-entry";
import { useProblems } from "@/hooks/use-problems";
import { useSetTrackPublished, useUpdateTrack } from "@/hooks/use-update-track";
import { ShareTrackLink } from "./share-track-link";

export function ManageTrack({
  track,
  lessonCount,
}: {
  track: LessonTrack;
  lessonCount: number;
}) {
  const t = useTranslations("RoadmapPage");
  const tTracks = useTranslations("TracksPage");
  const { mutate: setPublished, isPending: isPublishPending } =
    useSetTrackPublished();
  const { mutate: updateTrack } = useUpdateTrack();

  return (
    <div className="flex flex-col gap-4 rounded-md border p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="font-medium text-sm">{t("manageTrack")}</span>
        <div className="flex flex-wrap items-center gap-4">
          <ShareTrackLink classroomId={track.classroomId} />

          <label className="flex items-center gap-2 text-sm">
            {t("dueDatePrefix")}
            <Input
              className="w-auto"
              defaultValue={
                track.dueDate
                  ? new Date(track.dueDate).toISOString().slice(0, 10)
                  : ""
              }
              onChange={(e) =>
                updateTrack(
                  {
                    trackId: track.id,
                    dueDate: e.target.value ? new Date(e.target.value) : null,
                  },
                  { onError: (error) => toast.error(error.message) },
                )
              }
              type="date"
            />
          </label>

          {track.isPublished ? (
            <Badge>{tTracks("published")}</Badge>
          ) : (
            <Button
              disabled={isPublishPending || lessonCount === 0}
              onClick={() =>
                setPublished(
                  { trackId: track.id, isPublished: true },
                  { onError: (error) => toast.error(error.message) },
                )
              }
            >
              <LoadingSwap
                className="inline-flex items-center gap-2"
                isLoading={isPublishPending}
              >
                <Rocket className="size-4" />
                {tTracks("publish")}
              </LoadingSwap>
            </Button>
          )}
        </div>
      </div>
      {!track.isPublished && lessonCount === 0 && (
        <p className="text-muted-foreground text-xs">
          {tTracks("publishNeedsExercise")}
        </p>
      )}

      <AddLessonForm trackId={track.id} />
    </div>
  );
}

function AddLessonForm({ trackId }: { trackId: string }) {
  const t = useTranslations("RoadmapPage");
  const { data: problems } = useProblems({ page: 1, pageSize: 50, my: true });
  const [problemId, setProblemId] = useState<string | null>(null);
  const { mutate: createLessonEntry, isPending } = useCreateLessonEntry();

  function handleAdd() {
    if (!problemId) {
      toast.warning(t("addLesson"));
      return;
    }

    createLessonEntry(
      { trackId, problemId },
      {
        onError: (error) => toast.error(error.message),
        onSuccess: () => setProblemId(null),
      },
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select onValueChange={setProblemId} value={problemId ?? undefined}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder={t("addLesson")} />
        </SelectTrigger>
        <SelectContent>
          {problems?.data.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button disabled={isPending} onClick={handleAdd} size="sm">
        <Plus className="size-4" />
        {t("addLesson")}
      </Button>
    </div>
  );
}
