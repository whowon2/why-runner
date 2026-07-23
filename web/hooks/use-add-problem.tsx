import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addProblemToContest } from "@/lib/actions/contest/add-problem";

export type AddProblemToContestInput = {
  contestId: string;
  problemId: string;
};

export const useAddProblemToContest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddProblemToContestInput) => {
      return await addProblemToContest(input);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["contest", String(variables.contestId)],
      });
    },
  });
};
