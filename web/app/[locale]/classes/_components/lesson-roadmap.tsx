"use client";

import {
  CheckCircle2,
  Circle,
  ClipboardList,
  ListChecks,
  Send,
  Settings2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { Skeleton } from "@/components/ui/skeleton";
import { useLesson } from "@/hooks/use-lesson";
import { useSubmitLesson } from "@/hooks/use-submit-lesson";
import { cn } from "@/lib/utils";
import { ExerciseConstraintsPanel } from "./exercise-constraints";
import { ManageLesson } from "./manage-lesson";

export function LessonRoadmap({ lessonId }: { lessonId: string }) {
  const t = useTranslations("RoadmapPage");
  const tReview = useTranslations("RoadmapPage.Review");
  const tLessons = useTranslations("TracksPage");
  const { data, isPending } = useLesson(lessonId);
  const { mutate: submitLesson, isPending: isSubmitting } = useSubmitLesson();

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

  const { lesson, classroom, exercises, isOwner, submittedAt } = data;
  const dueDatePassed = !!(lesson.dueDate && new Date(lesson.dueDate) < new Date());

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        action={
          isOwner ? (
            <Button
              asChild
              size="sm"
              title={
                !dueDatePassed && lesson.dueDate
                  ? tReview("notYetAvailable")
                  : undefined
              }
              variant="outline"
            >
              <Link href={`/classes/${classroom.slug}/lessons/${lesson.slug}/review`}>
                <ClipboardList className="size-3.5" />
                {t("reviewAnswers")}
              </Link>
            </Button>
          ) : undefined
        }
        icon={ListChecks}
        subtitle={lesson.description || tLessons("defaultSubtitle")}
        title={lesson.title}
      />

      <div className="flex flex-wrap items-center gap-2">
        {lesson.dueDate && (
          <Badge className="w-fit" variant="outline">
            {t("dueDatePrefix")} {new Date(lesson.dueDate).toLocaleDateString()}
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

      {/* Students can resubmit the whole lesson as many times as they like
          before the due date — the button stays visible (relabeled
          "resubmit") instead of disappearing after the first submit. */}
      {!isOwner && !dueDatePassed && exercises.length > 0 && (
        <SubmitLessonButton
          incompleteCount={exercises.filter((e) => !e.done).length}
          isSubmitting={isSubmitting}
          onSubmit={() =>
            submitLesson(lessonId, {
              onError: (error: Error) => toast.error(error.message),
              onSuccess: () => toast.success(t("submitTrackSuccess")),
            })
          }
          submitted={!!submittedAt}
        />
      )}

      {isOwner && <ManageLesson exerciseCount={exercises.length} lesson={lesson} />}

      {exercises.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {exercises.map((e, idx) => (
            <div
              className={cn(
                "flex items-center justify-between gap-2 rounded-md border px-4 py-3 transition-colors hover:bg-muted",
                { "border-green-500/50": e.done },
              )}
              key={e.id}
            >
              <Link
                className="flex flex-1 items-center gap-3"
                href={`/classes/${classroom.slug}/lessons/${lesson.slug}/exercises/${e.slug}`}
              >
                <span className="text-muted-foreground text-sm tabular-nums">
                  {idx + 1}.
                </span>
                {e.done ? (
                  <CheckCircle2 className="size-4 text-green-500" />
                ) : (
                  <Circle className="size-4 text-muted-foreground" />
                )}
                <span>{e.problem.title}</span>
              </Link>
              <div className="flex items-center gap-2">
                {e.primaryLanguage && (
                  <Badge variant="outline">{e.primaryLanguage}</Badge>
                )}
                {isOwner && <ExerciseConstraintsDialog exerciseId={e.id} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Confirms before submitting a lesson that still has unsolved exercises — a
// resubmit with everything done skips the dialog entirely.
function SubmitLessonButton({
  incompleteCount,
  isSubmitting,
  onSubmit,
  submitted,
}: {
  incompleteCount: number;
  isSubmitting: boolean;
  onSubmit: () => void;
  submitted: boolean;
}) {
  const t = useTranslations("RoadmapPage");
  const tCommon = useTranslations("Common");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const label = submitted ? t("resubmitTrack") : t("submitTrack");
  const buttonContent = (
    <LoadingSwap
      className="inline-flex items-center gap-2"
      isLoading={isSubmitting}
    >
      <Send className="size-4" />
      {label}
    </LoadingSwap>
  );

  if (incompleteCount === 0) {
    return (
      <Button className="w-fit" disabled={isSubmitting} onClick={onSubmit}>
        {buttonContent}
      </Button>
    );
  }

  return (
    <AlertDialog onOpenChange={setConfirmOpen} open={confirmOpen}>
      <Button
        className="w-fit"
        disabled={isSubmitting}
        onClick={() => setConfirmOpen(true)}
      >
        {buttonContent}
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("incompleteSubmitTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("incompleteSubmitDescription", { count: incompleteCount })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onSubmit}>
            {t("submitAnyway")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ExerciseConstraintsDialog({ exerciseId }: { exerciseId: string }) {
  const t = useTranslations("RoadmapPage.Constraints");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" type="button" variant="outline">
          <Settings2 className="size-3.5" />
          {t("trigger")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <ExerciseConstraintsPanel exerciseId={exerciseId} />
      </DialogContent>
    </Dialog>
  );
}
