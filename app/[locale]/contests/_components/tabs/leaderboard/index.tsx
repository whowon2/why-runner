"use client";

import { Award } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useContestLeaderboard } from "@/hooks/use-contest-leaderboard";
import type { Contest, ProblemOnContest } from "@/lib/db/schema";
import { getAwardColor } from "@/lib/get-award-color";
import { letters } from "@/lib/letters";

export function Leaderboard({
  contest,
}: {
  contest: Contest & {
    problems: ProblemOnContest[];
  };
}) {
  const t = useTranslations("ContestsPage.Tabs.Leaderboard");
  const { data: leaderboard, isPending } = useContestLeaderboard(contest.id);

  if (isPending) {
    return <div>Loading</div>;
  }

  if (!leaderboard) return null;

  return (
    <div className="flex flex-col gap-4">
      <Card className="max-h-[70vh]">
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">{t("name")}</TableHead>
                {contest.problems.map((problem, idx) => (
                  <TableHead key={problem.problemId} className="text-center">
                    {letters[idx]}
                  </TableHead>
                ))}
                {/*<TableHead className="text-right">{t("score")}</TableHead>*/}
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard?.map((user) => (
                <TableRow key={user.userId}>
                  <TableCell className="font-medium">
                    {user.user.name}
                  </TableCell>
                  {contest.problems.map((_question, idx) => (
                    <TableCell key={idx} className="text-center">
                      <div className="flex justify-center">
                        {user.answered.includes(letters[idx] ?? "") && (
                          <Award color={getAwardColor(idx)} />
                        )}
                      </div>
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    {/*{new Set(user.answers).size}*/}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
