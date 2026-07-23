"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { ActivityCard } from "@/components/activity-card";
import { useFeed } from "@/hooks/use-feed";
import { Link } from "@/i18n/navigation";

export function FeedList({ scope }: { scope: "following" | "explore" }) {
  const t = useTranslations("SocialFeed");
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useFeed(scope);

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm rounded-2xl border bg-muted/20 space-y-1">
        <p>{scope === "following" ? t("emptyFollowing") : t("emptyExplore")}</p>
        {scope === "following" && (
          <p>
            <Link
              href="/feed?tab=explore"
              className="text-primary hover:underline"
            >
              {t("emptyFollowingCta")}
            </Link>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <ActivityCard
          key={item.id}
          activity={item}
          showFollow={scope === "explore"}
        />
      ))}

      <div ref={sentinelRef} />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
