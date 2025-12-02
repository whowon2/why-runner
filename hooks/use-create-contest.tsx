import { useMutation } from "@tanstack/react-query";
import { createContest } from "@/lib/actions/create-contest";
import type { contest } from "@/lib/db/schema";

type CreateContestInput = typeof contest.$inferInsert;

export const useCreateContest = () =>
  useMutation({
    mutationFn: async (input: CreateContestInput) => {
      return await createContest(input);
    },
  });
