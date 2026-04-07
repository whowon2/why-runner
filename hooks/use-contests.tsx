import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  getContests,
  type GetContestsParams,
} from "@/lib/actions/contest/get-contests";

export const useContests = (params: GetContestsParams) =>
  useQuery({
    queryKey: ["contests", params],
    queryFn: async () => {
      // Create a clean params object with serializable values
      const cleanParams = { ...params };
      // React Query passes all properties recursively, so we just forward it.
      return await getContests(cleanParams);
    },
    placeholderData: keepPreviousData,
  });
