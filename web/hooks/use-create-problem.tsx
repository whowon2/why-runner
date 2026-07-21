import { useMutation } from "@tanstack/react-query";
import type { CreateProblemInput } from "@/drizzle/schema";
import { createProblem } from "@/lib/actions/problems/create-problem";

export const useCreateProblem = () =>
  useMutation({
    mutationFn: async (input: CreateProblemInput) => {
      return await createProblem(input);
    },
  });
