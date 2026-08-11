"use client";

import { Brain, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProblemReview } from "@/lib/actions/problems/review-problem";
import { useReviewProblem } from "@/hooks/use-review-problem";

export function ProblemReviewPanel({
  problemId,
  onAddEdgeCaseAction,
}: {
  problemId: string;
  onAddEdgeCaseAction: (input: string, output: string) => void;
}) {
  const t = useTranslations("ProblemsPage.Create.Review");
  const { mutate: review, isPending } = useReviewProblem();
  const [result, setResult] = useState<ProblemReview | null>(null);
  const [addedIndexes, setAddedIndexes] = useState<Set<number>>(new Set());

  function handleReview() {
    review(problemId, {
      onError: (error) => {
        toast.error(t("reviewFailed"), { description: error.message });
      },
      onSuccess: (data) => {
        setResult(data);
        setAddedIndexes(new Set());
      },
    });
  }

  function handleAdd(index: number, input: string, output: string) {
    onAddEdgeCaseAction(input, output);
    setAddedIndexes((prev) => new Set(prev).add(index));
    toast.success(t("edgeCaseAdded"));
  }

  return (
    <div className="flex flex-col gap-4 rounded-none border p-4">
      <div>
        <h3 className="font-semibold text-lg">{t("title")}</h3>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>

      <Button
        className="max-w-min"
        disabled={isPending}
        onClick={handleReview}
        type="button"
        variant="outline"
      >
        <Brain className="h-4 w-4" />
        {isPending ? t("reviewing") : t("reviewWithAi")}
      </Button>

      {isPending && <Skeleton className="h-24 w-full" />}

      {result && !isPending && (
        <div className="flex flex-col gap-6">
          {result.descriptionFeedback && (
            <div className="prose dark:prose-invert max-w-none text-sm prose-p:leading-relaxed">
              <ReactMarkdown>{result.descriptionFeedback}</ReactMarkdown>
            </div>
          )}

          {result.edgeCases.length > 0 && (
            <div className="flex flex-col gap-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                {t("suggestedEdgeCases")}
              </h4>
              {result.edgeCases.map((edgeCase, index) => {
                const added = addedIndexes.has(index);
                return (
                  <div
                    className="flex flex-col gap-2 rounded-none border p-3"
                    key={`${index}-${edgeCase.input}`}
                  >
                    <p className="text-sm text-muted-foreground">
                      {edgeCase.rationale}
                    </p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <span className="text-muted-foreground text-xs font-semibold">
                          {t("input")}
                        </span>
                        <pre className="mt-1 max-h-32 overflow-auto rounded-md border bg-muted/50 p-2 font-mono text-xs whitespace-pre-wrap">
                          {edgeCase.input}
                        </pre>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs font-semibold">
                          {t("output")}
                        </span>
                        <pre className="mt-1 max-h-32 overflow-auto rounded-md border bg-muted/50 p-2 font-mono text-xs whitespace-pre-wrap">
                          {edgeCase.output}
                        </pre>
                      </div>
                    </div>
                    <Button
                      className="max-w-min"
                      disabled={added}
                      onClick={() =>
                        handleAdd(index, edgeCase.input, edgeCase.output)
                      }
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {added ? t("added") : t("addTestCase")}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {!result.descriptionFeedback && result.edgeCases.length === 0 && (
            <p className="text-muted-foreground text-sm">{t("noFeedback")}</p>
          )}
        </div>
      )}
    </div>
  );
}
