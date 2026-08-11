"use client";

import { Plus, Rocket, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import type { Lesson } from "@/drizzle/schema";
import { useCreateExerciseEntry } from "@/hooks/use-exercise-entry";
import { useProblems } from "@/hooks/use-problems";
import {
  useDeleteLesson,
  useSetLessonPublished,
  useUpdateLesson,
} from "@/hooks/use-update-lesson";
import { useRouter } from "@/i18n/navigation";
import { ShareLessonLink } from "./share-lesson-link";

export function ManageLesson({
  lesson,
  exerciseCount,
  classSlug,
}: {
  lesson: Lesson;
  exerciseCount: number;
  classSlug: string;
}) {
  const t = useTranslations("RoadmapPage");
  const tLessons = useTranslations("TracksPage");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const { mutate: setPublished, isPending: isPublishPending } =
    useSetLessonPublished();
  const { mutate: updateLesson } = useUpdateLesson();
  const { mutate: deleteLesson, isPending: isDeleting } = useDeleteLesson();

  return (
    <div className="flex flex-col gap-4 rounded-md border p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="font-medium text-sm">{t("manageTrack")}</span>
        <div className="flex flex-wrap items-center gap-4">
          <ShareLessonLink classroomId={lesson.classroomId} />

          <label className="flex items-center gap-2 text-sm">
            {t("dueDatePrefix")}
            <Input
              className="w-auto"
              defaultValue={
                lesson.dueDate
                  ? new Date(lesson.dueDate).toISOString().slice(0, 10)
                  : ""
              }
              onChange={(e) =>
                updateLesson(
                  {
                    lessonId: lesson.id,
                    dueDate: e.target.value ? new Date(e.target.value) : null,
                  },
                  { onError: (error) => toast.error(error.message) },
                )
              }
              type="date"
            />
          </label>

          {lesson.isPublished ? (
            <Badge>{tLessons("published")}</Badge>
          ) : (
            <>
              <Button
                disabled={isPublishPending || exerciseCount === 0}
                onClick={() =>
                  setPublished(
                    { lessonId: lesson.id, isPublished: true },
                    { onError: (error) => toast.error(error.message) },
                  )
                }
              >
                <LoadingSwap
                  className="inline-flex items-center gap-2"
                  isLoading={isPublishPending}
                >
                  <Rocket className="size-4" />
                  {tLessons("publish")}
                </LoadingSwap>
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={isDeleting}
                    size="icon"
                    variant="destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {tLessons("deleteLessonTitle")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {tLessons("deleteLessonDescription")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        deleteLesson(lesson.id, {
                          onError: (error) => toast.error(error.message),
                          onSuccess: () => {
                            toast.success(tLessons("deleteLessonSuccess"));
                            router.push(`/classes/${classSlug}`);
                          },
                        })
                      }
                    >
                      {tCommon("confirm")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>
      {!lesson.isPublished && exerciseCount === 0 && (
        <p className="text-muted-foreground text-xs">
          {tLessons("publishNeedsExercise")}
        </p>
      )}

      <AddExerciseForm lessonId={lesson.id} />
    </div>
  );
}

function AddExerciseForm({ lessonId }: { lessonId: string }) {
  const t = useTranslations("RoadmapPage");
  const { data: problems } = useProblems({ page: 1, pageSize: 50, my: true });
  const [problemId, setProblemId] = useState<string | null>(null);
  const { mutate: createExerciseEntry, isPending } = useCreateExerciseEntry();

  function handleAdd() {
    if (!problemId) {
      toast.warning(t("addLesson"));
      return;
    }

    createExerciseEntry(
      { lessonId, problemId },
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
