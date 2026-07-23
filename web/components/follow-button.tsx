"use client";

import { Loader, UserMinus, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useFollowState, useToggleFollow } from "@/hooks/use-follow";

export function FollowButton({
  targetUserId,
  size = "sm",
}: {
  targetUserId: string;
  size?: "sm" | "default";
}) {
  const t = useTranslations("Follow");
  const { data, isPending: isLoadingState } = useFollowState(targetUserId);
  const { mutate: toggle, isPending } = useToggleFollow(targetUserId);

  if (isLoadingState || !data) return null;

  return (
    <Button
      type="button"
      size={size}
      variant={data.isFollowing ? "outline" : "default"}
      disabled={isPending}
      onClick={() => toggle()}
    >
      {isPending ? (
        <Loader className="h-4 w-4 animate-spin" />
      ) : data.isFollowing ? (
        <UserMinus className="h-4 w-4" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      {data.isFollowing ? t("following") : t("follow")}
    </Button>
  );
}
