import { useInfiniteQuery } from "@tanstack/react-query";
import { getFeed } from "@/lib/actions/activity/get-feed";

export const useFeed = (scope: "following" | "explore") =>
  useInfiniteQuery({
    queryKey: ["feed", scope],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      getFeed({ scope, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
