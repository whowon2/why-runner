import { useMutation } from "@tanstack/react-query";
import { createProblem } from "@/lib/actions/problems/create-problem";

export const useCreateProblem = () =>
  useMutation({
    mutationFn: async () => {
      return await createProblem();
    },
  });
