"use client";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Code2,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProblems } from "@/hooks/use-problems";
import { useRouter } from "@/i18n/navigation";
import { DifficultyBadge, DraftBadge } from "../../problems/_components/badge";
import { CreateProblemButton } from "../../problems/_components/create-button";

const ITEMS_PER_PAGE = 10;

export function MyProblems({
  userId,
  isOwner,
}: {
  userId: string;
  isOwner: boolean;
}) {
  const t = useTranslations("UserPage.MyProblems");
  const tProblems = useTranslations("ProblemsPage");
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isPending, isPlaceholderData } = useProblems({
    page,
    pageSize: ITEMS_PER_PAGE,
    userId,
  });

  const problems = data?.data || [];
  const totalCount = data?.total || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-4 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {isOwner && (
        <div className="flex justify-end">
          <CreateProblemButton />
        </div>
      )}

      {isPending ? (
        <div className="flex justify-center py-8 text-muted-foreground">
          {t("loading")}
        </div>
      ) : problems.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Code2 />
            </EmptyMedia>
            <EmptyTitle>
              {isOwner ? t("emptyTitleOwner") : t("emptyTitleVisitor")}
            </EmptyTitle>
            <EmptyDescription>
              {isOwner
                ? t("emptyDescriptionOwner")
                : t("emptyDescriptionVisitor")}
            </EmptyDescription>
          </EmptyHeader>
          {isOwner && <CreateProblemButton />}
        </Empty>
      ) : (
        <div className="rounded-lg border">
          <Table className={isPlaceholderData ? "opacity-50" : ""}>
            <TableHeader>
              <TableRow>
                <TableHead>{tProblems("Table.name")}</TableHead>
                <TableHead>{tProblems("Table.solvedBy")}</TableHead>
                <TableHead>{tProblems("Table.solved")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {problems.map((prob) => (
                <TableRow
                  key={prob.id}
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(
                      prob.status === "draft"
                        ? `/problems/${prob.slug}?tab=edit`
                        : `/problems/${prob.slug}`,
                    )
                  }
                >
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      <span className="font-mono text-xs text-muted-foreground">
                        [{prob.code}]
                      </span>
                      {prob.title}
                      <DifficultyBadge difficulty={prob.difficulty} />
                      {prob.status === "draft" && <DraftBadge />}
                    </div>
                  </TableCell>
                  <TableCell>{prob.solvedByCount}</TableCell>
                  <TableCell>
                    {prob.solvedByMe ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!isPending && totalCount > 0 && (
        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            {tProblems("pagination.showing", {
              from: (page - 1) * ITEMS_PER_PAGE + 1,
              to: Math.min(page * ITEMS_PER_PAGE, totalCount),
              total: totalCount,
            })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium">
              {tProblems("pagination.page", { page, totalPages })}
            </div>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
