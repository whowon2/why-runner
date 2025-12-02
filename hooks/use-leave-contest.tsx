import { useMutation } from "@tanstack/react-query";
import { leaveContest } from "@/lib/actions/contest/leave-contest";

export type LeaveContestInput = {
  contestId: number;
  userId: string;
};

export const useLeaveContest = () =>
  useMutation({
    mutationFn: async (input: LeaveContestInput) => {
      return await leaveContest(input);
    },
  });
