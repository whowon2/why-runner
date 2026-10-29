"use client";

import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import { markdownComponents } from "@/components/markdown-components";
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
              <div className="prose dark:prose-invert prose-sm max-w-none mt-1">
                <ReactMarkdown components={markdownComponents}>
                  {problem.narrative}
                </ReactMarkdown>
              </div>
            </div>
          )}

          <div className="prose dark:prose-invert max-w-none text-foreground prose-p:leading-relaxed prose-pre:bg-muted/50">
            <ReactMarkdown
              components={markdownComponents}
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {problem.description}
            </ReactMarkdown>
          </div>

          <h2 className="my-4 font-semibold text-xl">
            {t("Tabs.Problem.Examples.title")}
          </h2>

          <ProblemExamples inputs={problem.inputs} outputs={problem.outputs} />
        </CardContent>
      </Card>
    </div>
  );
}
