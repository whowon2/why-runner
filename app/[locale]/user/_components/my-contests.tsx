"use client";

import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useContests } from "@/hooks/use-contests";
import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";
import { CreateContestDialog } from "../../contests/_components/create/dialog";

export function MyContests() {
  const { data: session } = authClient.useSession();
  const { data, isLoading } = useContests({
    page: 1,
    pageSize: 50,
    my: true,
    userId: session?.user?.id ?? "",
  });

  const contests = data?.data || [];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-neutral-900 to-neutral-500 dark:from-neutral-50 dark:to-neutral-400">
            My Contests
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your created contests and view participant submissions.
          </p>
        </div>
        <div className="shrink-0">
          <CreateContestDialog />
        </div>
      </div>

      <Separator className="w-full h-px bg-linear-to-r from-border to-transparent" />

      {isLoading ? (
        <div className="flex justify-center p-14">
          <span className="animate-pulse">Loading contests...</span>
        </div>
      ) : contests.length === 0 ? (
        <Card className="border-dashed shadow-sm bg-muted/20 transition-all hover:bg-muted/30 hover:shadow-md border-2">
          <CardContent className="flex flex-col items-center justify-center p-14 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-500/10 mb-6 transition-transform hover:scale-110 hover:bg-indigo-500/20 cursor-default">
              <Trophy className="h-10 w-10 text-indigo-500" />
            </div>
            <CardTitle className="mb-3 text-2xl font-semibold">
              No contests found
            </CardTitle>
            <CardDescription className="max-w-md mx-auto mb-8 text-base">
              You haven't created any contests yet. Get started by creating your
              first coding contest to share with your students or peers.
            </CardDescription>

            <div className="relative group">
              <div className="absolute -inset-1 blur-lg bg-linear-to-r from-indigo-500 to-cyan-500 opacity-20 group-hover:opacity-40 transition duration-500 rounded-lg"></div>
              <div className="relative">
                <CreateContestDialog />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contests.map((contest) => {
            const startDate = new Date(contest.startDate);
            const endDate = new Date(contest.endDate);
            const duration = Math.round(
              (endDate.getTime() - startDate.getTime()) / 60000,
            );

            return (
              <Card
                key={contest.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                  <div>
                    <h3
                      className="font-bold text-lg line-clamp-1 mb-2"
                      title={contest.name}
                    >
                      {contest.name}
                    </h3>
                    <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                      <p>
                        <strong>Start:</strong> {startDate.toLocaleString()}
                      </p>
                      <p>
                        <strong>Duration:</strong> {duration} minutes
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t mt-4">
                    <Link href={`/contests/${contest.id}`}>
                      <Button variant="secondary" className="w-full">
                        View Dashboard
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
