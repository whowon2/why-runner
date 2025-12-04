import { useMutation } from "@tanstack/react-query";
import { addProblemToContest } from "@/lib/actions/contest/add-problem";

export type AddProblemToContestInput = {
  contestId: number;
  problemId: number;
};

export const useAddProblemToContest = () =>
  useMutation({
    mutationFn: async (input: AddProblemToContestInput) => {
      return await addProblemToContest(input);
    },
  });
