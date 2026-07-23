"use client";

import { Loader2, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { FollowButton } from "@/components/follow-button";
import { useFollowList } from "@/hooks/use-follow-list";
import { Link } from "@/i18n/navigation";

export function FollowList({
  username,
  tab,
  currentUserId,
}: {
  username: string;
  tab: "followers" | "following";
  currentUserId: string;
}) {
  const t = useTranslations("FollowList");
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setQuery(input), 300);
    return () => clearTimeout(timeout);
  }, [input]);

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useFollowList(username, tab, query);

  const users = data?.pages.flatMap((page) => page.users) ?? [];

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

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm rounded-2xl border bg-muted/20">
          {query
            ? t("emptySearch")
            : tab === "followers"
              ? t("emptyFollowers")
              : t("emptyFollowing")}
        </div>
      ) : (
        <div className="space-y-1">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-foreground/5 transition-colors"
            >
              <Link href={`/user/${user.username}`}>
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={user.image ?? ""} />
                  <AvatarFallback>{user.name?.[0] ?? "?"}</AvatarFallback>
                </Avatar>
              </Link>
              <Link href={`/user/${user.username}`} className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  @{user.username}
                </p>
              </Link>
              {user.id !== currentUserId && (
                <FollowButton targetUserId={user.id} />
              )}
            </div>
          ))}

          <div ref={sentinelRef} />

          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
