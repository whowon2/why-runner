"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Feed } from "./feed";
import { MyContests } from "./my-contests";
import { MyProblems } from "./my-problems";

export function ProfileTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "feed";

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
        <MyContests />
      </TabsContent>
      <TabsContent value="problems">
        <MyProblems />
      </TabsContent>
    </Tabs>
  );
}
