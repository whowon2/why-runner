"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { Session } from "better-auth";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useJoinContest } from "@/hooks/use-join-contest";
import { useLeaveContest } from "@/hooks/use-leave-contest";
import { useRouter } from "@/i18n/navigation";
import type { Contest, UserOnContest } from "@/lib/db/schema";

export function JoinButton({
  contest,
  session,
  isCreatedByUser,
}: {
  contest: Contest & {
    users: UserOnContest[];
  };
  session: Session;
  isCreatedByUser: boolean;
}) {
  const t = useTranslations("ContestsPage.JoinButton");
  const { mutate: joinContest, isPending: isJoinPending } = useJoinContest();
  const { mutate: leaveContest, isPending: isLeavePending } = useLeaveContest();

  const router = useRouter();
  const queryClient = useQueryClient();

  const isUserInContest = contest.users.some(
    (user) => user.userId === session?.userId,
  );

  // if (isCreatedByUser) {
  //   return null;
  // }

  if (contest.startDate < new Date()) {
    return null;
  }

  if (isUserInContest) {
    return (
      <Button
        disabled={isLeavePending}
        onClick={() => {
          if (!session) {
            return;
          }

          leaveContest(
            { contestId: contest.id, userId: session.userId },
            {
              onError: (error) => {
                toast.error(t("Leave.error"), {
                  description: error.message,
                });
              },
              onSuccess: () => {
                toast(t("Leave.success"));
                router.refresh();
                queryClient.invalidateQueries({
                  queryKey: ["contest", String(contest.id)],
                });
                queryClient.invalidateQueries({
                  queryKey: ["contests", String(contest.id)],
                });
              },
            },
          );
        }}
        variant={"destructive"}
      >
        Sair
      </Button>
    );
  }

  return (
    <Button
      disabled={isJoinPending}
      onClick={() => {
        if (!session) {
          return;
        }

        joinContest(
          { contestId: contest.id, userId: session.userId },
          {
            onError: (error) => {
              toast.error(t("Join.error"), {
                description: error.message,
              });
            },
            onSuccess: () => {
              toast(t("Join.success"));
              router.refresh();
              queryClient.invalidateQueries({
                queryKey: ["contest", String(contest.id)],
              });
              queryClient.invalidateQueries({
                queryKey: ["contests", String(contest.id)],
              });
            },
          },
        );
      }}
      variant={"outline"}
    >
      Entrar
    </Button>
  );
}
