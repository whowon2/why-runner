import { useQuery } from "@tanstack/react-query";
import { getContests } from "@/lib/actions/get-contests";

export const useContests = () =>
  useQuery({
    queryKey: ["contests"],
    queryFn: async () => {
      return await getContests();
    },
  });
