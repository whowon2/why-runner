"use client";

import {
  AtSign,
  Bell,
  CheckCircle2,
  GraduationCap,
  Heart,
  MessageCircle,
  ScrollText,
  Trophy,
  UserPlus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Link } from "@/i18n/navigation";
import type { NotificationType } from "@/drizzle/schema";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-notifications";
import { useUnreadNotificationCount } from "@/hooks/use-unread-notification-count";
import { cn } from "@/lib/utils";

type NotificationItem = Awaited<
  ReturnType<typeof useNotifications>
>["data"] extends (infer T)[] | undefined
  ? T
  : never;

const relativeFormatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
});

function formatRelative(date: string | Date) {
  const diffMs = new Date(date).getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  if (Math.abs(diffMinutes) < 60)
    return relativeFormatter.format(diffMinutes, "minute");
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24)
    return relativeFormatter.format(diffHours, "hour");
  const diffDays = Math.round(diffHours / 24);
  return relativeFormatter.format(diffDays, "day");
}

function NotificationIcon({ type }: { type: NotificationType }) {
  if (type === "FOLLOW") return <UserPlus className="size-4 text-primary" />;
  if (type === "ACTIVITY_LIKE")
    return <Heart className="size-4 text-red-400" />;
  if (type === "ACTIVITY_COMMENT")
    return <MessageCircle className="size-4 text-primary" />;
  if (
    type === "CONTEST_JOIN_REQUEST" ||
    type === "CONTEST_JOIN_APPROVED" ||
    type === "CONTEST_JOIN_REJECTED"
  )
    return <Trophy className="size-4 text-primary" />;
  if (type === "SUBMISSION_GRADED")
    return <CheckCircle2 className="size-4 text-emerald-500" />;
  if (type === "FOLLOWED_USER_PUBLISHED_PROBLEM")
    return <ScrollText className="size-4 text-primary" />;
  if (type === "LESSON_UNLOCKED")
    return <GraduationCap className="size-4 text-primary" />;
  return <AtSign className="size-4 text-primary" />;
}

function useDescribeNotification() {
  const t = useTranslations("Notifications.types");

  return (n: NotificationItem) => {
    const primaryActor = n.actors[n.actors.length - 1];
    const actorName = primaryActor?.name ?? primaryActor?.username ?? "";

    switch (n.type) {
      case "FOLLOW":
        return {
          text:
            n.count > 1
              ? t("FOLLOW_others", { name: actorName, count: n.count - 1 })
              : t("FOLLOW", { name: actorName }),
          href: primaryActor?.username
            ? `/user/${primaryActor.username}`
            : "/user",
        };
      case "ACTIVITY_LIKE":
        return {
          text:
            n.count > 1
              ? t("ACTIVITY_LIKE_others", { count: n.count })
              : t("ACTIVITY_LIKE", { name: actorName }),
          href: "/feed",
        };
      case "ACTIVITY_COMMENT":
        return {
          text: t("ACTIVITY_COMMENT", { name: actorName }),
          href: "/feed",
        };
      case "CONTEST_JOIN_REQUEST":
        return {
          text: t("CONTEST_JOIN_REQUEST", {
            name: actorName,
            contest: n.contest?.name ?? "",
          }),
          href: n.contest ? `/contests/${n.contest.slug}` : "/contests",
        };
      case "CONTEST_JOIN_APPROVED":
        return {
          text: t("CONTEST_JOIN_APPROVED", { contest: n.contest?.name ?? "" }),
          href: n.contest ? `/contests/${n.contest.slug}` : "/contests",
        };
      case "CONTEST_JOIN_REJECTED":
        return {
          text: t("CONTEST_JOIN_REJECTED", { contest: n.contest?.name ?? "" }),
          href: "/contests",
        };
      case "SUBMISSION_GRADED": {
        const problemTitle = n.problem?.title ?? "";
        const key =
          n.submission?.status === "PASSED"
            ? "SUBMISSION_GRADED_PASSED"
            : n.submission?.status === "FAILED"
              ? "SUBMISSION_GRADED_FAILED"
              : "SUBMISSION_GRADED_ERROR";
        return {
          text: t(key, { problem: problemTitle }),
          href: n.problem ? `/problems/${n.problem.slug}` : "/problems",
        };
      }
      case "FOLLOWED_USER_PUBLISHED_PROBLEM":
        return {
          text: t("FOLLOWED_USER_PUBLISHED_PROBLEM", {
            name: actorName,
            problem: n.problem?.title ?? "",
          }),
          href: n.problem ? `/problems/${n.problem.slug}` : "/problems",
        };
      case "LESSON_UNLOCKED":
        return {
          text: t("LESSON_UNLOCKED"),
          href: "/roadmap",
        };
      default:
        return { text: "", href: "#" };
    }
  };
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("Notifications");
  const describe = useDescribeNotification();

  const { data: unread } = useUnreadNotificationCount();
  const { data: notifications } = useNotifications();
  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const unreadCount = unread ?? 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("title")}
          className="relative inline-flex size-9 items-center justify-center rounded-none hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 max-h-96 overflow-y-auto p-0"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="text-sm font-semibold">{t("title")}</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAll.mutate()}
              className="text-xs text-primary hover:underline"
            >
              {t("markAllRead")}
            </button>
          )}
        </div>

        {notifications === undefined ? (
          <div className="px-4 py-6 text-sm text-muted-foreground text-center">
            {t("loading")}
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground text-center">
            {t("empty")}
          </div>
        ) : (
          <div className="py-1">
            {notifications.map((n) => {
              const { text, href } = describe(n);
              return (
                <Link
                  key={n.id}
                  href={href}
                  onClick={() => {
                    if (!n.read) markOne.mutate(n.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-start gap-2.5 px-4 py-2.5 hover:bg-accent/50 transition-colors",
                    !n.read && "bg-primary/5",
                  )}
                >
                  <span className="mt-0.5">
                    <NotificationIcon type={n.type} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="text-xs text-foreground/90 block">
                      {text}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">
                      {formatRelative(n.updatedAt)}
                    </span>
                  </span>
                  {!n.read && (
                    <span className="size-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
