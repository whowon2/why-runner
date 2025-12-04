"use client";

import type { User } from "better-auth";
import { Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter } from "@/i18n/navigation";
import { ContestsList } from "./contests";
import { Feed } from "./feed";

export function ProfileTabs({ user, tab }: { user: User; tab: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams],
  );

  const handleTabChange = (value: string) => {
    router.push(`${pathname}?${createQueryString("tab", value)}`, {
      scroll: false, // keeps the page from scrolling to top
    });
  };

  return (
    <Tabs defaultValue={tab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="feed">Feed</TabsTrigger>
        <TabsTrigger value="contests">Contests</TabsTrigger>
        <TabsTrigger value="problems">Problems</TabsTrigger>
      </TabsList>

      <TabsContent value="feed" className="flex flex-col gap-4">
        <Feed />
      </TabsContent>
      <TabsContent value="contests">
        <ContestsList user={user} />
      </TabsContent>
      <TabsContent value="problems">
        <Card>
          <CardHeader>
            <CardTitle className="justify-between flex">
              My Problems
              <Button variant={"secondary"}>
                <Plus />
                Create Problem
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6"></CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
