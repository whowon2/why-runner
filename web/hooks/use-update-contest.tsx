import { useMutation } from "@tanstack/react-query";
import { unwrap } from "@/lib/action-result";
import {
  type UpdateContestInput,
  updateContest,
} from "@/lib/actions/contest/update-contest";

export type { UpdateContestInput };

export const useUpdateContest = () =>
  useMutation({
    mutationFn: async (input: UpdateContestInput) => {
      return unwrap(await updateContest(input));
    },
  });
