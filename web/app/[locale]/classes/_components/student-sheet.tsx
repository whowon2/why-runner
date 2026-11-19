import { Sheet as SheetIcon } from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { StatusBadge } from "@/components/submissions/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useClassGradebook } from "@/hooks/use-class-gradebook";
import { useClassStudentSubmissions } from "@/hooks/use-class-student-submissions";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { MemberAvatar, type RosterMember } from "./member-row";

export type SheetStudent = RosterMember & { joinedAt: Date };

/**
 * One student's progress in this class: scores from the gradebook query (same
 * cache as the gradebook page, so the numbers always agree) and their latest
 * lesson-exercise submissions.
 */
export function StudentSheet({
  classroomId,
  classSlug,
  student,
  onOpenChange,
}: {
  classroomId: string;
  classSlug: string;
  student: SheetStudent | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("ClassesPage");
  const format = useFormatter();

  return (
    <Sheet onOpenChange={onOpenChange} open={!!student}>
      <SheetContent side="right">
        {student && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <MemberAvatar className="size-12" member={student} />
                <div className="flex min-w-0 flex-col gap-1">
                  <SheetTitle className="truncate">{student.name}</SheetTitle>
                  <SheetDescription className="flex flex-wrap gap-x-2 text-xs">
                    <Link
                      className="hover:underline"
                      href={`/user/${student.username}`}
                    >
                      @{student.username}
                    </Link>
                    {student.ra && (
                      <span className="font-mono">{student.ra}</span>
                    )}
                    <span>
                      {t("studentJoined", {
                        date: format.dateTime(new Date(student.joinedAt), {
                          dateStyle: "medium",
                        }),
                      })}
                    </span>
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <StudentScores classroomId={classroomId} userId={student.id} />
            <StudentSubmissions
              classSlug={classSlug}
              classroomId={classroomId}
              userId={student.id}
            />
            <Button asChild className="self-start" variant="outline">
              <Link href={`/classes/${classSlug}/gradebook`}>
                <SheetIcon className="size-4" />
                {t("gradebook")}
              </Link>
            </Button>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Score({
  value,
  className,
}: {
  value: number | null;
  className?: string;
}) {
  const t = useTranslations("ClassesPage");
  return (
    <span
      className={cn(
        "tabular-nums",
        value === null && "text-muted-foreground",
        className,
      )}
      title={value === null ? t("gradebookNotSubmitted") : undefined}
    >
      {value === null ? "—" : value.toFixed(2)}
    </span>
  );
}

function StudentScores({
  classroomId,
  userId,
}: {
  classroomId: string;
  userId: string;
}) {
  const t = useTranslations("ClassesPage");
  const { data, isPending, isError } = useClassGradebook(classroomId);

  if (isPending) return <Skeleton className="h-32 w-full" />;
  if (isError) return null;

  const row = data.rows.find((r) => r.student.id === userId);
  if (!row) return null;

  let column = 0;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">{t("studentScores")}</h3>
        <span className="text-sm">
          <span className="font-semibold tabular-nums">
            {row.total.toFixed(2)}
          </span>
          <span className="text-muted-foreground"> / {data.maxTotal}</span>
        </span>
      </div>
      {data.lessons.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {t("gradebookNoLessons")}
        </p>
      ) : (
        <ul className="flex flex-col divide-y border">
          {data.lessons.map((lesson, li) => {
            const start = column;
            column += lesson.exercises.length;
            return (
              <li className="flex flex-col gap-1 px-3 py-2" key={lesson.id}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {lesson.title}
                  </span>
                  <span className="text-sm font-semibold">
                    <Score value={row.lessonTotals[li]} />
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      / {lesson.exercises.length}
                    </span>
                  </span>
                </div>
                {lesson.exercises.length > 0 && (
                  <ul className="flex flex-col gap-0.5">
                    {lesson.exercises.map((exercise, ei) => (
                      <li
                        className="text-muted-foreground flex justify-between gap-2 text-xs"
                        key={exercise.id}
                      >
                        <span className="truncate">
                          {exercise.problemTitle}
                        </span>
                        <Score
                          className="text-foreground"
                          value={row.cells[start + ei]}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function StudentSubmissions({
  classroomId,
  classSlug,
  userId,
}: {
  classroomId: string;
  classSlug: string;
  userId: string;
}) {
  const t = useTranslations("ClassesPage");
  const format = useFormatter();
  // Re-renders every minute so "5 minutes ago" stays current.
  const now = useNow({ updateInterval: 60_000 });
  const { data, isPending, isError } = useClassStudentSubmissions(
    classroomId,
    userId,
  );

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">{t("studentRecentSubmissions")}</h3>
      {isPending ? (
        <Skeleton className="h-24 w-full" />
      ) : isError ? (
        <p className="text-muted-foreground text-sm">
          {t("studentSubmissionsError")}
        </p>
      ) : data.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {t("studentNoSubmissions")}
        </p>
      ) : (
        <ul className="flex flex-col divide-y border">
          {data.map((s) => (
            <li key={s.id}>
              <Link
                className="hover:bg-muted/50 flex items-center justify-between gap-3 px-3 py-2 transition-colors"
                href={`/classes/${classSlug}/lessons/${s.lessonSlug}/exercises/${s.exerciseSlug}`}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm">{s.problemTitle}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {s.lessonTitle} ·{" "}
                    {format.relativeTime(new Date(s.createdAt), now)}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline">{s.language}</Badge>
                  <StatusBadge status={s.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
