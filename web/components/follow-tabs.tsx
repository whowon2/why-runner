"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "@/i18n/navigation";

export function FollowTabs({
  username,
  active,
}: {
  username: string;
  active: "followers" | "following";
}) {
  const t = useTranslations("FollowList");
  const router = useRouter();

  return (
    <Tabs
      value={active}
      onValueChange={(value) =>
        router.push(`/user/${username}/${value}`, { scroll: false })
      }
      className="w-full"
    >
      <TabsList className="w-full h-12 justify-start rounded-none border-b bg-transparent p-0 flex gap-6">
        <TabsTrigger
          value="followers"
          className="rounded-none border-b-2 border-transparent px-4 py-3 font-semibold text-muted-foreground data-[state=active]:border-indigo-500 data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-foreground transition-all uppercase tracking-wider text-xs"
        >
          {t("followersTitle")}
        </TabsTrigger>
        <TabsTrigger
          value="following"
          className="rounded-none border-b-2 border-transparent px-4 py-3 font-semibold text-muted-foreground data-[state=active]:border-indigo-500 data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-foreground transition-all uppercase tracking-wider text-xs"
        >
          {t("followingTitle")}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
