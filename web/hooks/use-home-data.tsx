import { useQuery } from "@tanstack/react-query";
import { getHomeData } from "@/lib/actions/home/get-home-data";

export const homeDataKey = ["home"] as const;

export const useHomeData = () =>
  useQuery({
    queryKey: homeDataKey,
    queryFn: () => getHomeData(),
    // Judge verdicts, join approvals and new lessons land without a local
    // mutation to invalidate this, so always refetch when /home mounts.
    staleTime: 0,
  });
