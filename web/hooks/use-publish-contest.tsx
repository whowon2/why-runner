import { useMutation } from "@tanstack/react-query";
import { unwrap } from "@/lib/action-result";
import { publishContest } from "@/lib/actions/contest/publish-contest";

export const usePublishContest = () =>
  useMutation({
    mutationFn: async (contestId: string) =>
      unwrap(await publishContest(contestId)),
  });
