"use client";

import { Copy, Lock, School, Sheet } from "lucide-react";
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
import { AddCoTeacherDialog } from "./add-co-teacher-dialog";
import { CreateLessonButton } from "./create-lesson-button";
import { DeleteClassDialog } from "./delete-class-dialog";
import { EditClassDialog } from "./edit-class-dialog";
import { LeaveClassButton } from "./leave-class-button";
import { MemberRoleButton } from "./member-role-button";
import { RemoveMemberButton } from "./remove-member-button";

export function ClassDetail({ classroomId }: { classroomId: string }) {
  const t = useTranslations("ClassesPage");
  const tLessons = useTranslations("TracksPage");
  const { data: classData, isPending: isClassPending } = useClass(classroomId);
  const { data: lessons, isPending: isLessonsPending } =
    useClassLessons(classroomId);

  if (isClassPending) return <Skeleton className="h-32 w-full" />;
  if (!classData) return null;

  // canManage: owner, co-teachers and admins. isOwner: owner-level (owner or
  // admin) — only they delete the class and manage co-teachers.
  const { classroom, role, canManage, isOwner, memberCount, members } =
    classData;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        action={
          canManage ? (
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
              <Button asChild variant="outline">
                <Link href={`/classes/${classroom.slug}/gradebook`}>
                  <Sheet className="size-4" />
                  {t("gradebook")}
                </Link>
              </Button>
              <EditClassDialog
                classroomId={classroomId}
                name={classroom.name}
              />
              <CreateLessonButton
                classSlug={classroom.slug}
                classroomId={classroomId}
              />
              {isOwner && <DeleteClassDialog classroomId={classroomId} />}
              {role === "teacher" && (
                <LeaveClassButton classroomId={classroomId} />
              )}
            </>
          ) : (
            <LeaveClassButton classroomId={classroomId} />
          )
        }
        icon={School}
        subtitle={t("memberCount", { count: memberCount })}
        title={classroom.name}
      />

      {canManage && (
        <Card className="bg-transparent shadow-none">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">{t("teachers")}</CardTitle>
            {isOwner && <AddCoTeacherDialog classroomId={classroomId} />}
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-1">
              {classData.owner && (
                <li className="flex items-center gap-2">
                  <Link
                    className="text-sm hover:underline"
                    href={`/user/${classData.owner.username}`}
                  >
                    {classData.owner.name}
                  </Link>
                  <Badge variant="default">{t("roleOwner")}</Badge>
                </li>
              )}
              {classData.coTeachers.map((m) => (
                <li
                  className="flex items-center justify-between gap-2"
                  key={m.id}
                >
                  <span className="flex items-center gap-2">
                    <Link
                      className="text-sm hover:underline"
                      href={`/user/${m.username}`}
                    >
                      {m.name}
                    </Link>
                    <Badge variant="outline">{t("roleCoTeacher")}</Badge>
                  </span>
                  {isOwner && (
                    <span className="flex items-center">
                      <MemberRoleButton
                        classroomId={classroomId}
                        role="teacher"
                        userId={m.id}
                      />
                      <RemoveMemberButton
                        classroomId={classroomId}
                        coTeacher
                        userId={m.id}
                      />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {canManage && (
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
                  <li
                    className="flex items-center justify-between gap-2"
                    key={m.id}
                  >
                    <div className="flex items-baseline gap-2">
                      <Link
                        className="text-sm hover:underline"
                        href={`/user/${m.username}`}
                      >
                        {m.name}
                      </Link>
                      {m.ra && (
                        <span className="font-mono text-muted-foreground text-xs">
                          {m.ra}
                        </span>
                      )}
                    </div>
                    <span className="flex items-center">
                      {isOwner && (
                        <MemberRoleButton
                          classroomId={classroomId}
                          role="student"
                          userId={m.id}
                        />
                      )}
                      <RemoveMemberButton
                        classroomId={classroomId}
                        userId={m.id}
                      />
                    </span>
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
      )}
    </div>
  );
}
