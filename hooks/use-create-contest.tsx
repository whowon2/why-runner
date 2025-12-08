import { useMutation } from "@tanstack/react-query";
import type { contest } from "@/drizzle/schema";
import { createContest } from "@/lib/actions/contest/create-contest";

type CreateContestInput = typeof contest.$inferInsert;

export const useCreateContest = () =>
  useMutation({
    mutationFn: async (input: CreateContestInput) => {
      return await createContest(input);
    },
  });
