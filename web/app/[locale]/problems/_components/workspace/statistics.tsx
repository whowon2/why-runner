"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useProblemStatistics } from "@/hooks/use-problem-statistics";

export function ProblemStatisticsTab({ problemId }: { problemId: string }) {
  const t = useTranslations("ProblemsPage.Workspace.Statistics");
  const { data: stats, isPending } = useProblemStatistics(problemId);

  if (isPending || !stats) {
    return <Skeleton className="h-32 w-full" />;
  }

  return (
    <div className="max-w-md">
      <h2 className="mb-2 font-bold text-xl">{t("title")}</h2>
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
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
