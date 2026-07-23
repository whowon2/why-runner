"use client";

import { Newspaper } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter } from "@/i18n/navigation";
import { FeedList } from "./feed-list";

export function FeedTabs() {
  const t = useTranslations("SocialFeed");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "following";

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
      scroll: false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Newspaper className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">{t("title")}</h1>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full h-12 justify-start rounded-none border-b bg-transparent p-0 flex gap-6">
          <TabsTrigger
            value="following"
            className="rounded-none border-b-2 border-transparent px-4 py-3 font-semibold text-muted-foreground data-[state=active]:border-indigo-500 data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-foreground transition-all uppercase tracking-wider text-xs"
          >
            {t("followingTab")}
          </TabsTrigger>
          <TabsTrigger
            value="explore"
            className="rounded-none border-b-2 border-transparent px-4 py-3 font-semibold text-muted-foreground data-[state=active]:border-indigo-500 data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-foreground transition-all uppercase tracking-wider text-xs"
          >
            {t("exploreTab")}
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="following" className="mt-0 outline-none">
            <FeedList scope="following" />
          </TabsContent>
          <TabsContent value="explore" className="mt-0 outline-none">
            <FeedList scope="explore" />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
