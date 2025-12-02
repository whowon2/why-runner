import { useMutation } from "@tanstack/react-query";
import { updateContest } from "@/lib/actions/contest/update-contest";
import type { Contest } from "@/lib/db/schema";

export type UpdateContestInput = {
  contestId: number;
  contest: Partial<Contest>;
};

export const useUpdateContest = () =>
  useMutation({
    mutationFn: async (input: UpdateContestInput) => {
      return await updateContest(input);
    },
  });
