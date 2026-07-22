"use client";

import { useProblemForEdit } from "@/hooks/use-problem-for-edit";
import { NewProblem } from "../create";
import { PublishProblem } from "../publish-button";

export function ProblemEditTab({ problemId }: { problemId: string }) {
  const { data: problem } = useProblemForEdit(problemId);

  if (!problem) return null;

  return (
    <>
      <NewProblem problem={problem} />

      {problem.status === "draft" && (
        <div className="border-t pt-6 mt-8">
          <PublishProblem problem={problem} />
        </div>
      )}
    </>
  );
}
