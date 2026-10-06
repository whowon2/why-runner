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
import { Switch } from "@/components/ui/switch";
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

export function ManageLesson({
  lesson,
  exerciseCount,
  classSlug,
  existingProblemIds,
}: {
  lesson: Lesson;
  exerciseCount: number;
  classSlug: string;
  existingProblemIds: string[];
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
      {/* Header: status badge top-left, draft actions on the right. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant={lesson.isPublished ? "default" : "outline"}>
          {lesson.isPublished ? tLessons("published") : tLessons("unpublished")}
        </Badge>
        <div className="flex items-center gap-2">
          {!lesson.isPublished && (
            <>
              <Button
                disabled={isPublishPending || exerciseCount === 0}
                onClick={() =>
                  setPublished(
                    { lessonId: lesson.id, isPublished: true },
                    { onError: (error) => toast.error(error.message) },
                  )
                }
                size="sm"
              >
                <LoadingSwap
                  className="inline-flex items-center gap-2"
                  isLoading={isPublishPending}
                >
                  <Rocket className="size-3.5" />
                  {tLessons("publish")}
                </LoadingSwap>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={isDeleting}
                    size="icon-sm"
                    variant="destructive"
                  >
                    <Trash2 className="size-3.5" />
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
        <p className="-mt-2 text-muted-foreground text-xs">
          {tLessons("publishNeedsExercise")}
        </p>
      )}

      {/* Settings */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="flex items-center gap-2 text-sm">
          {t("dueDatePrefix")}
          <Input
            className="w-auto"
            defaultValue={
              lesson.dueDate
                ? toLocalDateInputValue(new Date(lesson.dueDate))
                : ""
            }
            onChange={(e) =>
              updateLesson(
                {
                  lessonId: lesson.id,
                  // Due at the end of the picked day in the professor's
                  // timezone — `new Date("YYYY-MM-DD")` would be UTC
                  // midnight, i.e. the previous evening in Brazil.
                  dueDate: e.target.value
                    ? new Date(`${e.target.value}T23:59:59.999`)
                    : null,
                },
                { onError: (error) => toast.error(error.message) },
              )
            }
            type="date"
          />
        </label>

        <label
          className="flex items-center gap-2 text-sm"
          title={t("showOutputsHint")}
        >
          {t("showOutputs")}
          <Switch
            checked={lesson.showOutputs}
            onCheckedChange={(checked) =>
              updateLesson(
                { lessonId: lesson.id, showOutputs: checked },
                { onError: (error) => toast.error(error.message) },
              )
            }
          />
        </label>
      </div>

      <div className="border-t pt-4">
        <AddExerciseForm
          existingProblemIds={existingProblemIds}
          lessonId={lesson.id}
        />
      </div>
    </div>
  );
}

/** `YYYY-MM-DD` in local time, as `<input type="date">` expects. */
function toLocalDateInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function AddExerciseForm({
  lessonId,
  existingProblemIds,
}: {
  lessonId: string;
  existingProblemIds: string[];
}) {
  const t = useTranslations("RoadmapPage");
  const { data: problems } = useProblems({ page: 1, pageSize: 50, my: true });
  const [problemId, setProblemId] = useState<string | null>(null);
  const { mutate: createExerciseEntry, isPending } = useCreateExerciseEntry();

  const availableProblems = (problems?.data ?? []).filter(
    (p) => !existingProblemIds.includes(p.id),
  );

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
          {availableProblems.length === 0 && (
            <p className="px-2 py-1.5 text-muted-foreground text-sm">
              {t("noProblemsToAdd")}
            </p>
          )}
          {availableProblems.map((p) => (
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
