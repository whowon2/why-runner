import { useInfiniteQuery } from "@tanstack/react-query";
import { getFollowList } from "@/lib/actions/follow/get-follow-list";

export const useFollowList = (
  username: string,
  tab: "followers" | "following",
  query: string,
) =>
  useInfiniteQuery({
    queryKey: ["follow-list", username, tab, query],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      getFollowList({ username, tab, cursor: pageParam, query }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
