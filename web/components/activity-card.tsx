"use client";

import {
  BookOpen,
  Heart,
  Loader,
  MessageCircle,
  MoreHorizontal,
  Send,
  Trash2,
  Trophy,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { FollowButton } from "@/components/follow-button";
import {
  useAddActivityComment,
  useDeleteActivityComment,
} from "@/hooks/use-activity-comments";
import {
  useActivityEngagement,
  useActivityLike,
  useDeleteActivity,
} from "@/hooks/use-activity-like";
import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";

export type ActivityCardComment = {
  id: string;
  content: string;
  createdAt: Date | string;
  userId: string;
  user: { id: string; name: string; username: string } | null;
  replies?: ActivityCardComment[];
};

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

function CommentRow({
  comment,
  currentUserId,
  locale,
  t,
  onReply,
  onDelete,
  isDeleting,
  isReply = false,
}: {
  comment: ActivityCardComment;
  currentUserId: string | undefined;
  locale: string;
  t: ReturnType<typeof useTranslations>;
  onReply?: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  isReply?: boolean;
}) {
  const isAuthor = currentUserId && comment.userId === currentUserId;

  return (
    <div className={`flex gap-2 text-xs ${isReply ? "ml-6" : ""}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold shrink-0">
            {comment.user?.name ?? comment.user?.username}
          </span>
          <span className="text-muted-foreground break-words">
            {comment.content}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-muted-foreground">
          <span>{formatRelativeTime(new Date(comment.createdAt), locale)}</span>
          {onReply && (
            <button
              type="button"
              onClick={onReply}
              className="hover:text-foreground transition-colors"
            >
              {t("reply")}
            </button>
          )}
        </div>
      </div>
      {isAuthor && (
        <button
          type="button"
          disabled={isDeleting}
          onClick={onDelete}
          aria-label={t("deleteComment")}
          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
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
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: engagement } = useActivityEngagement([activity.id]);
  const entry = engagement?.[activity.id];
  const { mutate: toggleLike, isPending: isLiking } = useActivityLike(
    activity.id,
  );
  const { mutate: addComment, isPending: isCommenting } = useAddActivityComment(
    activity.id,
  );
  const { mutate: deleteComment, isPending: isDeletingComment } =
    useDeleteActivityComment();
  const { mutate: removeActivity, isPending: isDeletingActivity } =
    useDeleteActivity();

  const isContest = activity.type === "CONTEST_CREATED";
  const isOwnActivity = !!currentUser && activity.user?.id === currentUser.id;

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
    addComment({ content: trimmed }, { onSuccess: () => setCommentText("") });
  }

  function handleReply(parentId: string) {
    const trimmed = replyText.trim();
    if (!trimmed || isCommenting) return;
    addComment(
      { content: trimmed, parentId },
      {
        onSuccess: () => {
          setReplyText("");
          setReplyToId(null);
        },
      },
    );
  }

  function handleDeleteComment(commentId: string) {
    deleteComment(commentId, {
      onError: (error) =>
        toast.error(t("deleteCommentError"), { description: error.message }),
    });
  }

  function handleDeleteActivity() {
    removeActivity(activity.id, {
      onError: (error) =>
        toast.error(t("deleteActivityError"), { description: error.message }),
    });
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
            <div className="flex items-center gap-1 shrink-0">
              {showFollow &&
                activity.user &&
                currentUser &&
                activity.user.id !== currentUser.id && (
                  <FollowButton targetUserId={activity.user.id} size="sm" />
                )}
              {isOwnActivity && (
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={t("moreOptions")}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Trash2 className="w-4 h-4" />
                          {t("delete")}
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("deleteActivityTitle")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("deleteActivityDescription")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={isDeletingActivity}
                        onClick={handleDeleteActivity}
                      >
                        {t("delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
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
              {(entry?.comments ?? []).reduce(
                (count, c) => count + 1 + (c.replies?.length ?? 0),
                0,
              )}
            </button>
          </div>

          {commentsOpen && (
            <div className="mt-2 space-y-3">
              <Separator />
              {entry?.comments.map((comment) => (
                <div key={comment.id} className="space-y-2">
                  <CommentRow
                    comment={comment}
                    currentUserId={currentUser?.id}
                    locale={locale}
                    t={t}
                    onReply={() =>
                      setReplyToId((id) =>
                        id === comment.id ? null : comment.id,
                      )
                    }
                    onDelete={() => handleDeleteComment(comment.id)}
                    isDeleting={isDeletingComment}
                  />
                  {comment.replies?.map((reply) => (
                    <CommentRow
                      key={reply.id}
                      comment={reply}
                      currentUserId={currentUser?.id}
                      locale={locale}
                      t={t}
                      onDelete={() => handleDeleteComment(reply.id)}
                      isDeleting={isDeletingComment}
                      isReply
                    />
                  ))}
                  {replyToId === comment.id && (
                    <div className="flex items-center gap-2 ml-6">
                      <Input
                        value={replyText}
                        onChange={(e) =>
                          setReplyText(e.target.value.slice(0, 500))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleReply(comment.id);
                        }}
                        placeholder={t("replyPlaceholder")}
                        className="flex-1 h-8 text-xs"
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={!replyText.trim() || isCommenting}
                        onClick={() => handleReply(comment.id)}
                      >
                        {isCommenting ? (
                          <Loader className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  )}
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
