import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  getContests,
  type GetContestsParams,
} from "@/lib/actions/contest/get-contests";

export const useContests = (params: GetContestsParams) =>
  useQuery({
    queryKey: ["contests", params],
    queryFn: async () => {
      return await getContests(params);
    },
    placeholderData: keepPreviousData,
  });
