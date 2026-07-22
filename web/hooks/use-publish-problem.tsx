import { useMutation } from "@tanstack/react-query";
import { publishProblem } from "@/lib/actions/problems/publish-problem";

export const usePublishProblem = () =>
  useMutation({
    mutationFn: (problemId: string) => publishProblem(problemId),
  });
