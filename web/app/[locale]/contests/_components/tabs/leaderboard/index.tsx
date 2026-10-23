"use client";

import { Loader2, Lock, Medal, Star, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Contest } from "@/drizzle/schema";
import { useContestLeaderboard } from "@/hooks/use-contest-leaderboard";
import { Link } from "@/i18n/navigation";
import {
  type Cell,
  PENALTY_PER_REJECTION_MIN,
  type StandingsProblem,
  type StandingsRow,
} from "@/lib/contest/standings";
import { cn } from "@/lib/utils";

const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"] as const;

// Fixed widths (rem) for every column except the problems: those share the
// leftover width equally (never below PROBLEM_W, via the table's minWidth),
// so a wide screen spreads the problems instead of the participant column.
// SOLVED_W/PENALTY_W fit the longest header label ("Resolvidos").
const RANK_W = 3;
const PARTICIPANT_W = 16;
const PROBLEM_W = 4;
const SOLVED_W = 7;
const PENALTY_W = 7;

// Sticky cells need an opaque background; the viewer's highlight is mixed in
// rather than layered with opacity so scrolled content doesn't show through.
const BASE_BG = "bg-card";
const VIEWER_BG = "bg-[color-mix(in_oklab,var(--primary)_10%,var(--card))]";

function RankCell({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <div className="flex items-center justify-center" aria-label={`${rank}`}>
        <Medal className="size-5" style={{ color: MEDAL_COLORS[rank - 1] }} />
      </div>
    );
  }
  return <span className="text-muted-foreground font-medium">{rank}</span>;
}

function ProblemCell({ cell }: { cell: Cell }) {
  const t = useTranslations("ContestsPage.Tabs.Leaderboard");
  const box =
    "relative mx-auto flex h-10 w-12 flex-col items-center justify-center rounded-md text-xs leading-tight tabular-nums";

  switch (cell.state) {
    case "solved": {
      const label = [
        t("cellSolved", { minute: cell.minute, attempts: cell.attempts }),
        cell.firstSolve ? t("cellFirstSolve") : null,
      ]
        .filter(Boolean)
        .join(" · ");
      return (
        <div
          title={label}
          aria-label={label}
          className={cn(
            box,
            cell.firstSolve
              ? "bg-emerald-600 text-white dark:bg-emerald-500"
              : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
          )}
        >
          {cell.firstSolve && (
            <Star className="absolute -top-1.5 -right-1.5 size-3.5 fill-amber-400 text-amber-400" />
          )}
          <span className="font-semibold text-sm">{cell.attempts}</span>
          <span className="opacity-80">{cell.minute}'</span>
        </div>
      );
    }
    case "attempted": {
      const label = t("cellAttempted", { attempts: cell.attempts });
      return (
        <div
          title={label}
          aria-label={label}
          className={cn(box, "bg-rose-500/15 text-rose-700 dark:text-rose-400")}
        >
          <span className="font-semibold text-sm">{cell.attempts}</span>
        </div>
      );
    }
    case "pending": {
      const label = t("cellPending");
      return (
        <div
          title={label}
          aria-label={label}
          className={cn(
            box,
            "bg-amber-500/15 text-amber-700 dark:text-amber-400",
          )}
        >
          {cell.attempts > 0 && (
            <span className="font-semibold text-sm">{cell.attempts}</span>
          )}
          <Loader2 className="size-3.5 animate-spin" />
        </div>
      );
    }
    case "untouched":
      return (
        <div
          title={t("cellUntouched")}
          className={cn(box, "text-muted-foreground/60")}
        >
          –
        </div>
      );
  }
}

function StandingsTableRow({
  row,
  problems,
  isViewer,
  rowRef,
  pinned,
}: {
  row: StandingsRow;
  problems: StandingsProblem[];
  isViewer: boolean;
  rowRef?: React.Ref<HTMLTableRowElement>;
  pinned?: boolean;
}) {
  const t = useTranslations("ContestsPage.Tabs.Leaderboard");
  const bg = isViewer ? VIEWER_BG : BASE_BG;
  const stickyY = pinned ? "sticky bottom-0 z-10" : "";

  return (
    <TableRow
      ref={rowRef}
      className={cn("hover:bg-transparent", pinned && "border-t-2")}
    >
      <TableCell
        className={cn(
          "sticky left-0 z-10 text-center",
          bg,
          stickyY,
          pinned && "z-20",
        )}
      >
        <RankCell rank={row.rank} />
      </TableCell>
      <TableCell
        className={cn("sticky z-10", bg, stickyY, pinned && "z-20")}
        style={{ left: `${RANK_W}rem` }}
      >
        <Link
          href={`/user/${row.user.username}`}
          className="flex min-w-0 items-center gap-2 hover:underline"
          title={row.user.name}
        >
          <Avatar className="size-6 shrink-0">
            {row.user.image && <AvatarImage src={row.user.image} alt="" />}
            <AvatarFallback className="text-[10px]">
              {row.user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="truncate font-medium">{row.user.name}</span>
          {isViewer && (
            <span className="shrink-0 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
              {t("you")}
            </span>
          )}
        </Link>
      </TableCell>
      {problems.map((p) => (
        <TableCell key={p.problemId} className={cn("px-1", bg, stickyY)}>
          <ProblemCell
            cell={row.cells[p.problemId] ?? { state: "untouched" }}
          />
        </TableCell>
      ))}
      <TableCell
        className={cn("text-right font-semibold tabular-nums", bg, stickyY)}
      >
        {row.solved}
      </TableCell>
      <TableCell
        className={cn(
          "text-right tabular-nums text-muted-foreground",
          bg,
          stickyY,
        )}
      >
        {row.penalty}
      </TableCell>
    </TableRow>
  );
}

export function Leaderboard({
  contest,
  userId,
}: {
  contest: Pick<Contest, "id" | "startDate" | "endDate">;
  userId: string;
}) {
  const t = useTranslations("ContestsPage.Tabs.Leaderboard");
  const { data: standings, isPending } = useContestLeaderboard({
    contestId: contest.id,
    startDate: contest.startDate,
    endDate: contest.endDate,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const viewerRowRef = useRef<HTMLTableRowElement>(null);
  const [viewerRowVisible, setViewerRowVisible] = useState(true);

  const viewerRow = standings?.rows.find((r) => r.user.id === userId);

  useEffect(() => {
    const target = viewerRowRef.current;
    if (!target || !scrollRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setViewerRowVisible(entry.isIntersecting),
      // Shrink the root by roughly the sticky header height so a row hidden
      // behind it counts as not visible. No bottom margin: the pinned footer
      // only exists once the row is already out of view, and reserving its
      // height up front made a short table's last row toggle the footer on
      // and off forever (showing it grows the table, which reveals the row).
      { root: scrollRef.current, rootMargin: "-48px 0px 0px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [viewerRow?.user.id, standings]);

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

  if (!standings) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
          <Lock className="w-8 h-8 opacity-40" />
          <p className="text-sm font-medium">{t("unavailable")}</p>
        </CardContent>
      </Card>
    );
  }

  if (standings.rows.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
          <Trophy className="w-8 h-8 opacity-40" />
          <p className="text-sm font-medium">{t("empty")}</p>
        </CardContent>
      </Card>
    );
  }

  const { problems, rows } = standings;
  const minWidth =
    RANK_W +
    PARTICIPANT_W +
    problems.length * PROBLEM_W +
    SOLVED_W +
    PENALTY_W;

  const headBase = "sticky top-0 z-20 bg-card";

  return (
    <Card className="py-0 overflow-hidden">
      <CardContent className="px-0">
        <div ref={scrollRef} className="max-h-[70vh] overflow-auto">
          <table
            className="w-full table-fixed caption-bottom text-sm"
            style={{ minWidth: `${minWidth}rem` }}
          >
            <colgroup>
              <col style={{ width: `${RANK_W}rem` }} />
              <col style={{ width: `${PARTICIPANT_W}rem` }} />
              {problems.map((p) => (
                <col key={p.problemId} />
              ))}
              <col style={{ width: `${SOLVED_W}rem` }} />
              <col style={{ width: `${PENALTY_W}rem` }} />
            </colgroup>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={cn(headBase, "left-0 z-30 text-center")}>
                  {t("rank")}
                </TableHead>
                <TableHead
                  className={cn(headBase, "z-30")}
                  style={{ left: `${RANK_W}rem` }}
                >
                  {t("participant")}
                </TableHead>
                {problems.map((p) => (
                  <TableHead
                    key={p.problemId}
                    className={cn(headBase, "px-1 text-center")}
                  >
                    {p.letter}
                  </TableHead>
                ))}
                <TableHead className={cn(headBase, "text-right")}>
                  {t("solved")}
                </TableHead>
                <TableHead className={cn(headBase, "text-right")}>
                  {t("penalty")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const isViewer = row.user.id === userId;
                return (
                  <StandingsTableRow
                    key={row.user.id}
                    row={row}
                    problems={problems}
                    isViewer={isViewer}
                    rowRef={isViewer ? viewerRowRef : undefined}
                  />
                );
              })}
            </TableBody>
            {viewerRow && !viewerRowVisible && (
              <TableFooter className="bg-transparent">
                <StandingsTableRow
                  row={viewerRow}
                  problems={problems}
                  isViewer
                  pinned
                />
              </TableFooter>
            )}
          </table>
        </div>
        <p className="border-t px-4 py-3 text-xs text-muted-foreground">
          {t("legend", { penalty: PENALTY_PER_REJECTION_MIN })}
        </p>
      </CardContent>
    </Card>
  );
}
