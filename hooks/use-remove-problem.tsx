import { useMutation } from "@tanstack/react-query";
import { removeProblemToContest } from "@/lib/actions/contest/remove-problem";

export type RemoveProblemFromContestInput = {
  contestId: number;
  problemId: number;
};

export const useRemoveProblemToContest = () =>
  useMutation({
    mutationFn: async (input: RemoveProblemFromContestInput) => {
      return await removeProblemToContest(input);
    },
  });
