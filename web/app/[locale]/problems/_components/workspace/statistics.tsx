"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useExerciseStatistics } from "@/hooks/use-exercise-statistics";
import { useProblemStatistics } from "@/hooks/use-problem-statistics";

type Stats = {
  solvedByCount: number;
  attemptedByCount: number;
  successRate: number;
};

/** Solved by / attempted by / success rate, shared by every Statistics drawer. */
export function StatisticsTable({
  stats,
  note,
  extraRows,
}: {
  stats: Stats | undefined;
  /** Says whose submissions the numbers count. */
  note?: ReactNode;
  extraRows?: { label: string; value: ReactNode }[];
}) {
  const t = useTranslations("ProblemsPage.Workspace.Statistics");

  if (!stats) {
    return <Skeleton className="h-32 w-full" />;
  }

  return (
    <div className="flex max-w-md flex-col gap-2">
      {note && <p className="text-muted-foreground text-sm">{note}</p>}
      <div className="rounded-lg border">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">{t("solvedBy")}</TableCell>
              <TableCell>{stats.solvedByCount}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">{t("attemptedBy")}</TableCell>
              <TableCell>{stats.attemptedByCount}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">{t("successRate")}</TableCell>
              <TableCell>{(stats.successRate * 100).toFixed(2)}%</TableCell>
            </TableRow>
            {extraRows?.map((row) => (
              <TableRow key={row.label}>
                <TableCell className="font-medium">{row.label}</TableCell>
                <TableCell>{row.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function ProblemStatisticsTab({ problemId }: { problemId: string }) {
  const { data: stats } = useProblemStatistics(problemId);
  return <StatisticsTable stats={stats} />;
}

/** Class-scoped for class managers, problem-wide for students (server decides). */
export function ExerciseStatisticsTab({ exerciseId }: { exerciseId: string }) {
  const t = useTranslations("ProblemsPage.Workspace.Statistics");
  const { data: stats } = useExerciseStatistics(exerciseId);

  return (
    <StatisticsTable
      extraRows={
        stats?.scope === "class" && stats.studentCount !== null
          ? [{ label: t("students"), value: stats.studentCount }]
          : undefined
      }
      note={
        stats
          ? stats.scope === "class"
            ? t("scopeClass")
            : t("scopeGlobal")
          : null
      }
      stats={stats}
    />
  );
}
