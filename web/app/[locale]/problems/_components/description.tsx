"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { useProblem } from "@/hooks/use-problem";
import { ProblemExamples } from "./examples";

export function ProblemDescription({ problemId }: { problemId: string }) {
  const t = useTranslations("ContestsPage");
  const tCommon = useTranslations("Common");
  const tProblems = useTranslations("ProblemsPage");

  const { data: problem, isPending } = useProblem(problemId);

  if (isPending) {
    return <div>{tCommon("loading")}</div>;
  }

  if (!problem) {
    return <div>{tProblems("notFound")}</div>;
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <Card className="bg-transparent shadow-none">
        <CardContent>
          {problem.narrative && (
            <div className="mb-6 border-l-2 border-muted-foreground/30 pl-4 italic text-muted-foreground">
              <span className="not-italic text-[10px] font-semibold uppercase tracking-wider">
                {tProblems("Workspace.Task.narrativeLabel")}
              </span>
              <pre className="mt-1 whitespace-pre-wrap font-sans">
                {problem.narrative}
              </pre>
            </div>
          )}

          <pre className="whitespace-pre-wrap rounded-md ">
            {problem.description}
          </pre>

          <h2 className="my-4 font-semibold text-xl">
            {t("Tabs.Problem.Examples.title")}
          </h2>

          <ProblemExamples inputs={problem.inputs} outputs={problem.outputs} />
        </CardContent>
      </Card>
    </div>
  );
}
