"use client";

import { ArrowLeft, ScanSearch } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/page-header";
import {
  SimilarityReport,
  usePickParam,
} from "@/components/similarity/similarity-report";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContestProblemSimilarity } from "@/hooks/use-contest-problem-similarity";
import { Link } from "@/i18n/navigation";

export function ContestSimilarity({
  contestId,
  contestSlug,
  contestName,
  problems,
}: {
  contestId: string;
  contestSlug: string;
  contestName: string;
  problems: { id: string; letter: string; title: string }[];
}) {
  const t = useTranslations("Similarity");
  const [pick] = usePickParam();
  const [problemParam, setProblem] = useQueryState("problem", parseAsString);
  const [, setPair] = useQueryState("pair", parseAsString);
  const problemId =
    problems.find((p) => p.id === problemParam)?.id ?? problems[0]?.id ?? null;
  const { data, isPending, error } = useContestProblemSimilarity(
    contestId,
    problemId,
    pick,
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 py-8">
      <Button asChild className="w-fit px-0" variant="link">
        <Link href={`/contests/${contestSlug}?tab=manage`}>
          <ArrowLeft />
          {t("backToContest")}
        </Link>
      </Button>
      <PageHeader
        icon={ScanSearch}
        subtitle={t("contestSubtitle", { contest: contestName })}
        title={t("title")}
      />
      {problemId === null ? (
        <p className="text-muted-foreground">{t("noProblems")}</p>
      ) : (
        <SimilarityReport
          data={data}
          error={error}
          filters={
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">{t("problem")}</span>
              <Select
                onValueChange={(v) => {
                  setProblem(v);
                  setPair(null);
                }}
                value={problemId}
              >
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {problems.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.letter}. {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          }
          isPending={isPending}
        />
      )}
    </div>
  );
}
