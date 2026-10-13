import { useMutation } from "@tanstack/react-query";
import { unwrap } from "@/lib/action-result";
import { publishProblem } from "@/lib/actions/problems/publish-problem";

export const usePublishProblem = () =>
  useMutation({
    mutationFn: async (problemId: string) =>
      unwrap(await publishProblem(problemId)),
  });
