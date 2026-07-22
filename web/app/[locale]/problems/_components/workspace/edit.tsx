"use client";

import { useProblemForEdit } from "@/hooks/use-problem-for-edit";
import { NewProblem } from "../create";

export function ProblemEditTab({ problemId }: { problemId: string }) {
  const { data: problem } = useProblemForEdit(problemId);

  if (!problem) return null;

  return <NewProblem problem={problem} />;
}
