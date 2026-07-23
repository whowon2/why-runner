import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createContest } from "@/lib/actions/contest/create-contest";

export const useCreateContest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await createContest();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contests"] });
    },
  });
};
