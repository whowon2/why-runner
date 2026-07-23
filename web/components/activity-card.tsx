"use client";

import {
  BookOpen,
  Heart,
  Loader,
  MessageCircle,
  Send,
  Trophy,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { FollowButton } from "@/components/follow-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useActivityEngagement,
  useActivityLike,
} from "@/hooks/use-activity-like";
import { useAddActivityComment } from "@/hooks/use-activity-comments";
import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";

export type ActivityCardItem = {
  id: string;
  type: string;
  description: string | null;
  createdAt: Date | string;
  user: {
    id: string;
    name: string;
    username: string;
    image?: string | null;
  } | null;
  contest: { id: string; name: string; slug: string } | null;
  problem: { id: string; title: string; slug: string } | null;
};

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

function formatRelativeTime(date: Date, locale: string) {
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  for (const [unit, secondsInUnit] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= secondsInUnit) {
      return rtf.format(Math.round(seconds / secondsInUnit), unit);
    }
  }
  return rtf.format(seconds, "second");
}

export function ActivityCard({
  activity,
  showFollow = false,
}: {
  activity: ActivityCardItem;
  showFollow?: boolean;
}) {
  const t = useTranslations("UserPage.Feed");
  const locale = useLocale();
  const { data: session } = authClient.useSession();
  const currentUser = session?.user;
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");

  const { data: engagement } = useActivityEngagement([activity.id]);
  const entry = engagement?.[activity.id];
  const { mutate: toggleLike, isPending: isLiking } = useActivityLike(
    activity.id,
  );
  const { mutate: addComment, isPending: isCommenting } = useAddActivityComment(
    activity.id,
  );

  const isContest = activity.type === "CONTEST_CREATED";

  const contentTitle = isContest
    ? activity.contest?.name
    : activity.problem?.title;
  const contentHref = isContest
    ? activity.contest?.slug
      ? `/contests/${activity.contest.slug}`
      : null
    : activity.problem?.slug
      ? `/problems/${activity.problem.slug}`
      : null;
  const actionText = isContest ? t("contestAction") : t("problemAction");

  function handleComment() {
    const trimmed = commentText.trim();
    if (!trimmed || isCommenting) return;
    addComment(trimmed, { onSuccess: () => setCommentText("") });
  }

  return (
    <div className="rounded-none border bg-card p-4">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={activity.user?.image ?? ""} />
          <AvatarFallback>{activity.user?.name?.[0] ?? "?"}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {activity.user?.username ? (
                <Link
                  href={`/user/${activity.user.username}`}
                  className="text-sm font-semibold hover:text-primary transition-colors"
                >
                  {activity.user.name}
                </Link>
              ) : (
                <span className="text-sm font-semibold">
                  {activity.user?.name ?? t("someone")}
                </span>
              )}
              <div className="text-xs text-muted-foreground mt-0.5">
                {actionText} ·{" "}
                {formatRelativeTime(new Date(activity.createdAt), locale)}
              </div>
            </div>
            {showFollow &&
              activity.user &&
              currentUser &&
              activity.user.id !== currentUser.id && (
                <FollowButton targetUserId={activity.user.id} size="sm" />
              )}
          </div>

          {activity.description && (
            <p className="mt-2 text-sm text-muted-foreground italic">
              "{activity.description}"
            </p>
          )}

          {contentTitle && (
            <div className="mt-2 rounded-none border bg-muted/30 p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                {isContest ? (
                  <Trophy className="w-4 h-4 text-indigo-500 shrink-0" />
                ) : (
                  <BookOpen className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
                {contentHref ? (
                  <Link
                    href={contentHref}
                    className="text-sm font-semibold truncate hover:text-primary transition-colors"
                  >
                    {contentTitle}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold truncate">
                    {contentTitle}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <button
              type="button"
              disabled={isLiking}
              onClick={() => toggleLike()}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-none transition-all ${
                entry?.isLiked ? "text-rose-500" : "hover:text-foreground"
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 ${entry?.isLiked ? "fill-current" : ""}`}
              />
              {entry?.likeCount ?? 0}
            </button>
            <button
              type="button"
              onClick={() => setCommentsOpen((v) => !v)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-none transition-all ${
                commentsOpen ? "text-primary" : "hover:text-foreground"
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {entry?.comments.length ?? 0}
            </button>
          </div>

          {commentsOpen && (
            <div className="mt-2 space-y-3 border-t pt-3">
              {entry?.comments.map((comment) => (
                <div key={comment.id} className="flex gap-2 text-xs">
                  <span className="font-semibold shrink-0">
                    {comment.user?.name ?? comment.user?.username}
                  </span>
                  <span className="text-muted-foreground break-words">
                    {comment.content}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value.slice(0, 500))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleComment();
                  }}
                  placeholder={t("commentPlaceholder")}
                  className="flex-1 h-8 text-xs"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={!commentText.trim() || isCommenting}
                  onClick={handleComment}
                >
                  {isCommenting ? (
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
