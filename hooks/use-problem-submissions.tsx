import { useQuery } from "@tanstack/react-query";
import { getContestSubmissions } from "@/lib/actions/contest/get-submissions";

export type GetUserSubmissionsOnContest = {
  userId: string;
  contestId: number;
  problemId: number;
};

export const useProblemSubmissions = (input: GetUserSubmissionsOnContest) =>
  useQuery({
    queryKey: ["submissions", String(input.problemId)],
    queryFn: async () => {
      console.log("Fetching submissions");
      return await getContestSubmissions(input);
    },
    refetchInterval: 1000,
  });
