"use client";

import { Award, Medal, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Contest, ProblemOnContest } from "@/drizzle/schema";
import { useContestLeaderboard } from "@/hooks/use-contest-leaderboard";
import { getAwardColor } from "@/lib/get-award-color";
import { letters } from "@/lib/letters";

const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"] as const;

function RankCell({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <div className="flex items-center justify-center">
        <Medal className="w-5 h-5" style={{ color: MEDAL_COLORS[rank - 1] }} />
      </div>
    );
  }
  return <span className="text-muted-foreground font-medium">{rank}</span>;
}

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
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
          <Trophy className="w-8 h-8 opacity-40" />
          <p className="text-sm font-medium">{t("empty")}</p>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...leaderboard].sort(
    (a, b) => b.answered.length - a.answered.length,
  );

  return (
    <div className="flex flex-col gap-4">
      <Card className="max-h-[70vh] overflow-auto">
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] text-center">
                  {t("rank")}
                </TableHead>
                <TableHead className="w-[160px]">{t("name")}</TableHead>
                {contest.problems.map((problem, idx) => (
                  <TableHead key={problem.problemId} className="text-center">
                    {letters[idx]}
                  </TableHead>
                ))}
                <TableHead className="text-right">{t("score")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((user, idx) => (
                <TableRow key={user.userId}>
                  <TableCell className="text-center">
                    <RankCell rank={idx + 1} />
                  </TableCell>
                  <TableCell className="font-medium">
                    {user.user.name}
                  </TableCell>
                  {contest.problems.map((_question, pIdx) => (
                    <TableCell key={pIdx} className="text-center">
                      <div className="flex justify-center">
                        {user.answered.includes(letters[pIdx] ?? "") && (
                          <Award color={getAwardColor(pIdx)} />
                        )}
                      </div>
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-semibold">
                    {user.answered.length}
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
