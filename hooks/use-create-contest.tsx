import { useMutation } from "@tanstack/react-query";
import { createContest, type CreateContestInput } from "@/lib/actions/contest/create-contest";

export const useCreateContest = () =>
  useMutation({
    mutationFn: async (input: CreateContestInput) => {
      return await createContest(input);
    },
  });
