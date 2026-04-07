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
    <Tabs defaultValue={tab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full h-14 justify-start rounded-none border-b bg-transparent p-0 flex gap-6 overflow-x-auto no-scrollbar">
        <TabsTrigger 
          value="feed" 
          className="rounded-none border-b-2 border-transparent px-4 py-4 font-semibold text-muted-foreground data-[state=active]:border-indigo-500 data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-foreground transition-all uppercase tracking-wider text-xs"
        >
          Activity Feed
        </TabsTrigger>
        <TabsTrigger 
          value="contests" 
          className="rounded-none border-b-2 border-transparent px-4 py-4 font-semibold text-muted-foreground data-[state=active]:border-indigo-500 data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-foreground transition-all uppercase tracking-wider text-xs"
        >
          Live Contests
        </TabsTrigger>
        <TabsTrigger 
          value="problems" 
          className="rounded-none border-b-2 border-transparent px-4 py-4 font-semibold text-muted-foreground data-[state=active]:border-indigo-500 data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-foreground transition-all uppercase tracking-wider text-xs"
        >
          Algorithm Vault
        </TabsTrigger>
      </TabsList>

      <div className="mt-8">
        <TabsContent value="feed" className="mt-0 outline-none">
          <Feed />
        </TabsContent>
        <TabsContent value="contests" className="mt-0 outline-none">
          <MyContests />
        </TabsContent>
        <TabsContent value="problems" className="mt-0 outline-none">
          <MyProblems />
        </TabsContent>
      </div>
    </Tabs>
  );
}
