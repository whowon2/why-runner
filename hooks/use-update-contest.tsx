import { useMutation } from "@tanstack/react-query";
import type { Contest } from "@/drizzle/schema";
import { updateContest } from "@/lib/actions/contest/update-contest";

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
