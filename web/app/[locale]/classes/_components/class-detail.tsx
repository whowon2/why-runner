"use client";

import { Copy, Lock, School } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { useClass } from "@/hooks/use-class";
import { useClassLessons } from "@/hooks/use-lessons";
import { CreateLessonButton } from "./create-lesson-button";
import { EditClassDialog } from "./edit-class-dialog";

export function ClassDetail({ classroomId }: { classroomId: string }) {
  const t = useTranslations("ClassesPage");
  const tLessons = useTranslations("TracksPage");
  const { data: classData, isPending: isClassPending } = useClass(classroomId);
  const { data: lessons, isPending: isLessonsPending } =
    useClassLessons(classroomId);

  if (isClassPending) return <Skeleton className="h-32 w-full" />;
  if (!classData) return null;

  const { classroom, isOwner, memberCount, members } = classData;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        action={
          isOwner ? (
            <>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(classroom.joinCode);
                  toast.success(t("codeCopied"));
                }}
                variant="outline"
              >
                <Copy className="size-4" />
                {t("joinCode")}: {classroom.joinCode}
              </Button>
              <EditClassDialog
                classroomId={classroomId}
                name={classroom.name}
              />
              <CreateLessonButton
                classSlug={classroom.slug}
                classroomId={classroomId}
              />
            </>
          ) : undefined
        }
        icon={School}
        subtitle={t("memberCount", { count: memberCount })}
        title={classroom.name}
      />

      {isOwner && (
        <Card className="bg-transparent shadow-none">
          <CardHeader>
            <CardTitle className="text-base">{t("students")}</CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t("noStudentsYet")}
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {members.map((m) => (
                  <li key={m.id}>
                    <Link
                      className="text-sm hover:underline"
                      href={`/user/${m.username}`}
                    >
                      {m.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {isLessonsPending ? (
        <Skeleton className="h-24 w-full" />
      ) : !lessons || lessons.length === 0 ? (
        <p className="text-muted-foreground">{tLessons("empty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {lessons.map((lesson) => {
            const dueDatePassed = !!(
              lesson.dueDate && new Date(lesson.dueDate) < new Date()
            );

            return (
              <Link
                href={`/classes/${classroom.slug}/lessons/${lesson.slug}`}
                key={lesson.id}
              >
                <Card className="h-full bg-muted/30 transition-colors hover:bg-muted/60">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2 text-lg">
                      {lesson.title}
                      {!lesson.isPublished && (
                        <Badge variant="outline">
                          <Lock className="size-3" />
                          {tLessons("unpublished")}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {lesson.description && (
                      <p className="text-muted-foreground text-sm">
                        {lesson.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {!isOwner && (
                        <Badge variant="outline">
                          {tLessons("exerciseProgress", {
                            done: lesson.completedCount ?? 0,
                            total: lesson.exerciseCount,
                          })}
                        </Badge>
                      )}
                      {isOwner && (
                        <Badge variant="outline">
                          {tLessons("exerciseCount", {
                            count: lesson.exerciseCount,
                          })}
                        </Badge>
                      )}
                      {lesson.dueDate && (
                        <Badge variant="outline">
                          {tLessons("dueDatePrefix")}{" "}
                          {new Date(lesson.dueDate).toLocaleDateString()}
                        </Badge>
                      )}
                      {!isOwner && lesson.mySubmission && (
                        <Badge className="bg-blue-500">
                          {tLessons("submittedAt", {
                            date: new Date(
                              lesson.mySubmission.submittedAt,
                            ).toLocaleDateString(),
                          })}
                        </Badge>
                      )}
                      {!isOwner && lesson.mySubmission?.reviewedAt && (
                        <Badge className="bg-green-600">
                          {tLessons("scoreLabel", {
                            score: lesson.mySubmission.score.toFixed(2),
                          })}
                        </Badge>
                      )}
                      {!isOwner &&
                        lesson.mySubmission &&
                        !lesson.mySubmission.reviewedAt &&
                        dueDatePassed && (
                          <Badge variant="outline">
                            {tLessons("awaitingReview")}
                          </Badge>
                        )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
