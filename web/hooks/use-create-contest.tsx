import { useMutation } from "@tanstack/react-query";
import {
  type CreateContestInput,
  createContest,
} from "@/lib/actions/contest/create-contest";

export const useCreateContest = () =>
  useMutation({
    mutationFn: async (input: CreateContestInput) => {
      return await createContest(input);
    },
  });
