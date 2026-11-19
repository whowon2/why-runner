"use client";

import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useClassLessons } from "@/hooks/use-lessons";
import { Link } from "@/i18n/navigation";

/** The class's lesson cards (progress badges for students, counts for managers). */
export function ClassLessons({
  classroomId,
  classSlug,
  canManage,
}: {
  classroomId: string;
  classSlug: string;
  canManage: boolean;
}) {
  const tLessons = useTranslations("TracksPage");
  const { data: lessons, isPending: isLessonsPending } =
    useClassLessons(classroomId);

  return isLessonsPending ? (
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
            href={`/classes/${classSlug}/lessons/${lesson.slug}`}
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
                  {!canManage && (
                    <Badge variant="outline">
                      {tLessons("exerciseProgress", {
                        done: lesson.completedCount ?? 0,
                        total: lesson.exerciseCount,
                      })}
                    </Badge>
                  )}
                  {canManage && (
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
                  {!canManage && lesson.mySubmission && (
                    <Badge className="bg-blue-500">
                      {tLessons("submittedAt", {
                        date: new Date(
                          lesson.mySubmission.submittedAt,
                        ).toLocaleDateString(),
                      })}
                    </Badge>
                  )}
                  {!canManage && lesson.mySubmission?.reviewedAt && (
                    <Badge className="bg-green-600">
                      {tLessons("scoreLabel", {
                        score: lesson.mySubmission.score.toFixed(2),
                      })}
                    </Badge>
                  )}
                  {!canManage &&
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
  );
}
