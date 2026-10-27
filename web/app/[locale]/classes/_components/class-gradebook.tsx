"use client";

import { ArrowLeft, Download, Sheet } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useClassGradebook } from "@/hooks/use-class-gradebook";
import { Link } from "@/i18n/navigation";
import { gradebookToCsv } from "@/lib/gradebook";
import { cn } from "@/lib/utils";

function ScoreCell({
  score,
  notSubmitted,
  strong,
  className,
}: {
  score: number | null;
  notSubmitted: string;
  strong?: boolean;
  className?: string;
}) {
  return (
    <TableCell
      className={cn(
        "text-right tabular-nums",
        className,
        strong && "font-semibold",
        score === null && "text-muted-foreground",
      )}
      title={score === null ? notSubmitted : undefined}
    >
      {score === null ? "—" : score.toFixed(2)}
    </TableCell>
  );
}

export function ClassGradebook({ classroomId }: { classroomId: string }) {
  const t = useTranslations("ClassesPage");
  const { data, isPending, error } = useClassGradebook(classroomId);

  if (isPending)
    return (
      <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col gap-4 py-8">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  if (error || !data)
    return (
      <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col gap-4 py-8">
        <p className="text-destructive text-sm">{error?.message}</p>
      </div>
    );

  const { classroom, lessons, rows, maxTotal } = data;
  const now = new Date();

  function handleExport() {
    const blob = new Blob([gradebookToCsv({ lessons, rows, maxTotal })], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${classroom.slug}-gradebook-${now.toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Start of each lesson's slice in the flat `cells` array.
  const offsets: number[] = [];
  let column = 0;
  for (const l of lessons) {
    offsets.push(column);
    column += l.exercises.length;
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col gap-4 py-8">
      <PageHeader
        action={
          <>
            <Button asChild variant="outline">
              <Link href={`/classes/${classroom.slug}`}>
                <ArrowLeft className="size-4" />
                {t("backToClass")}
              </Link>
            </Button>
            <Button
              disabled={rows.length === 0 || lessons.length === 0}
              onClick={handleExport}
            >
              <Download className="size-4" />
              {t("gradebookExport")}
            </Button>
          </>
        }
        icon={Sheet}
        subtitle={t("gradebookSubtitle")}
        title={`${t("gradebook")} — ${classroom.name}`}
      />

      {rows.length === 0 ? (
        <p className="text-muted-foreground">{t("gradebookNoStudents")}</p>
      ) : lessons.length === 0 ? (
        <p className="text-muted-foreground">{t("gradebookNoLessons")}</p>
      ) : (
        <>
          <p className="text-muted-foreground text-xs">
            {t("gradebookLegend")}
          </p>
          <div className="border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="sticky left-0 z-10 bg-background"
                    rowSpan={2}
                  >
                    {t("gradebookStudent")}
                  </TableHead>
                  {lessons.map((l) => {
                    const open = !!l.dueDate && new Date(l.dueDate) > now;
                    return (
                      <TableHead
                        className="border-l text-center"
                        colSpan={l.exercises.length + 1}
                        key={l.id}
                      >
                        <span className="inline-flex items-center gap-2">
                          {l.title}
                          {open && (
                            <Badge
                              title={t("gradebookOpenHint")}
                              variant="outline"
                            >
                              {t("gradebookOpen")}
                            </Badge>
                          )}
                        </span>
                      </TableHead>
                    );
                  })}
                  <TableHead className="border-l text-right" rowSpan={2}>
                    {t("gradebookTotal")}
                  </TableHead>
                </TableRow>
                <TableRow>
                  {lessons.flatMap((l) => [
                    ...l.exercises.map((e, i) => (
                      <TableHead
                        className={cn(
                          "max-w-32 truncate text-right font-normal",
                          i === 0 && "border-l",
                        )}
                        key={e.id}
                        title={e.problemTitle}
                      >
                        {e.problemTitle}
                      </TableHead>
                    )),
                    <TableHead
                      className={cn(
                        "text-right",
                        l.exercises.length === 0 && "border-l",
                      )}
                      key={`${l.id}-total`}
                    >
                      {t("gradebookLessonTotal")}
                    </TableHead>,
                  ])}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.student.id}>
                    <TableCell className="sticky left-0 z-10 bg-background">
                      <Link
                        className="hover:underline"
                        href={`/user/${r.student.username}`}
                      >
                        {r.student.name}
                      </Link>
                    </TableCell>
                    {lessons.flatMap((l, li) => [
                      ...l.exercises.map((e, i) => (
                        <ScoreCell
                          className={i === 0 ? "border-l" : undefined}
                          key={e.id}
                          notSubmitted={t("gradebookNotSubmitted")}
                          score={r.cells[offsets[li] + i]}
                        />
                      )),
                      <ScoreCell
                        className={
                          l.exercises.length === 0 ? "border-l" : undefined
                        }
                        key={`${l.id}-total`}
                        notSubmitted={t("gradebookNotSubmitted")}
                        score={r.lessonTotals[li]}
                        strong
                      />,
                    ])}
                    <TableCell className="border-l text-right font-semibold tabular-nums">
                      {r.total.toFixed(2)} / {maxTotal}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
