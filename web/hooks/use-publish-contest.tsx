import { useMutation } from "@tanstack/react-query";
import { publishContest } from "@/lib/actions/contest/publish-contest";

export const usePublishContest = () =>
  useMutation({
    mutationFn: (contestId: string) => publishContest(contestId),
  });
