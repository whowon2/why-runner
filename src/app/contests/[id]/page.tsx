import { BreadCrumbs } from "@/app/_components/breadcrumbs";
import { JoinButton } from "@/app/_components/contests/join";
import { Leaderboard } from "@/app/_components/contests/leaderboard";
import { DescriptionTab } from "@/app/_components/contests/tabs/description";
import { SelectProblem } from "@/app/_components/contests/tabs/problem";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { Pencil } from "lucide-react";
import Link from "next/link";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();

  if (!session) {
    return <div>Unauthorized</div>;
  }

  const contest = await api.contest.findById(id);

  if (!contest) {
    return <div>Contest not found</div>;
  }

  const isCreatedByUser = contest.createdById === session.user.id;

  return (
    <div className="flex w-full flex-col items-center justify-center gap-4 p-4">
      <BreadCrumbs />
      <div className="flex flex-col items-center">
        <div className="flex gap-2">
          <h1 className="font-bold text-3xl">{contest.name}</h1>
          {isCreatedByUser && (
            <Link href={`${contest.id}/edit`}>
              <Pencil size={18} />
            </Link>
          )}
        </div>
        <JoinButton
          contest={contest}
          session={session}
          isCreatedByUser={isCreatedByUser}
        />
      </div>

      <Card className="w-full">
        <CardContent>
          <Tabs defaultValue="problems" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-background p-0">
              <TabsTrigger
                className="h-full rounded-none border border-transparent border-b-[3px] bg-background data-[state=active]:border-primary data-[state=active]:shadow-none"
                value="problems"
              >
                Problems
              </TabsTrigger>
              <TabsTrigger
                className="h-full rounded-none border border-transparent border-b-[3px] bg-background data-[state=active]:border-primary data-[state=active]:shadow-none"
                value="leaderboard"
              >
                Leaderboard
              </TabsTrigger>
              <TabsTrigger
                className="h-full rounded-none border border-transparent border-b-[3px] bg-background data-[state=active]:border-primary data-[state=active]:shadow-none"
                value="description"
              >
                Description
              </TabsTrigger>
            </TabsList>

            <TabsContent value="problems" className="flex gap-4">
              <SelectProblem contest={contest} />
            </TabsContent>
            <TabsContent value="leaderboard">
              <Leaderboard contest={contest} />
            </TabsContent>
            <TabsContent value="description">
              <DescriptionTab contest={contest} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
