import { useMutation } from "@tanstack/react-query";
import { createProblem } from "@/lib/actions/problems/create-problem";
import type { CreateProblemInput } from "@/lib/db/schema";

export const useCreateProblem = () =>
  useMutation({
    mutationFn: async (input: CreateProblemInput) => {
      return await createProblem(input);
    },
  });
