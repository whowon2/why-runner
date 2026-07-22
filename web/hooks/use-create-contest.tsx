import { useMutation } from "@tanstack/react-query";
import { createContest } from "@/lib/actions/contest/create-contest";

export const useCreateContest = () =>
  useMutation({
    mutationFn: async () => {
      return await createContest();
    },
  });
