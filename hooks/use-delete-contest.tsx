import { useMutation } from "@tanstack/react-query";
import { deleteContest } from "@/lib/actions/contest/delete-contest";

export const useDeleteContest = () =>
  useMutation({
    mutationFn: (contestId: string) => deleteContest(contestId),
  });
