import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteContest } from "@/lib/actions/contest/delete-contest";

export const useDeleteContest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contestId: string) => deleteContest(contestId),
    onSuccess: (_data, contestId) => {
      queryClient.invalidateQueries({ queryKey: ["contests"] });
      queryClient.invalidateQueries({ queryKey: ["contest", contestId] });
    },
  });
};
