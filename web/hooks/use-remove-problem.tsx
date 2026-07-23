import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeProblemToContest } from "@/lib/actions/contest/remove-problem";

export type RemoveProblemFromContestInput = {
  contestId: string;
  problemId: string;
};

export const useRemoveProblemToContest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RemoveProblemFromContestInput) => {
      return await removeProblemToContest(input);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["contest", String(variables.contestId)],
      });
    },
  });
};
