import { useMutation } from "@tanstack/react-query";
import { joinContest } from "@/lib/actions/contest/join-contest";

export type JoinContestInput = {
  contestId: number;
  userId: string;
};

export const useJoinContest = () =>
  useMutation({
    mutationFn: async (input: JoinContestInput) => {
      return await joinContest(input);
    },
  });
