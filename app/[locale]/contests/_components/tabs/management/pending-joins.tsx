"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { approveJoin } from "@/lib/actions/contest/approve-join";
import { getPendingJoins } from "@/lib/actions/contest/get-pending-joins";
import { rejectJoin } from "@/lib/actions/contest/reject-join";

export function PendingJoins({ contestId }: { contestId: string }) {
  const t = useTranslations("ContestsPage.Tabs.Management.PendingJoins");
  const queryClient = useQueryClient();

  const { data: pending = [] } = useQuery({
    queryKey: ["pending-joins", contestId],
    queryFn: () => getPendingJoins(contestId),
  });

  const approve = useMutation({
    mutationFn: (userId: string) => approveJoin(contestId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-joins", contestId] });
      toast.success(t("approveSuccess"));
    },
  });

  const reject = useMutation({
    mutationFn: (userId: string) => rejectJoin(contestId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-joins", contestId] });
      toast.success(t("rejectSuccess"));
    },
  });

  if (pending.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title", { count: pending.length })}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {pending.map((entry) => (
          <div
            key={entry.userId}
            className="flex items-center justify-between rounded border p-3"
          >
            <div className="flex items-center gap-3">
              {entry.user.image && (
                <img
                  src={entry.user.image}
                  alt={entry.user.name}
                  className="h-8 w-8 rounded-full"
                />
              )}
              <div>
                <p className="font-medium text-sm">{entry.user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.user.email}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => approve.mutate(entry.userId)}
                disabled={approve.isPending}
              >
                {t("approve")}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => reject.mutate(entry.userId)}
                disabled={reject.isPending}
              >
                {t("reject")}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
