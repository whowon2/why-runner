"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Language, Problem } from "@/drizzle/schema";
import { usePathname, useRouter } from "@/i18n/navigation";
import { ProblemDescription } from "../description";
import { ProblemResultsTab } from "./results";
import { ProblemStatisticsTab } from "./statistics";
import { ProblemSubmitTab } from "./submit";
import { ProblemTestsTab } from "./tests";

export function ProblemWorkspace({ problem }: { problem: Problem }) {
  const t = useTranslations("ProblemsPage.Workspace");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "task";

  // Lifted out of ProblemSubmitTab: Radix unmounts inactive TabsContent, so
  // state living inside that tab's own component gets wiped on tab switch.
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<Language | null>(null);

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
    <div className="flex w-full flex-1 flex-col gap-4">
      <Tabs
        className="w-full max-w-4xl mx-auto flex-1"
        defaultValue={tab}
        onValueChange={handleTabChange}
      >
        <div className="w-full overflow-x-auto pb-4 mb-2 scrollbar-hide">
          <TabsList className="inline-flex min-w-max h-12 items-center justify-start rounded-none bg-muted/40 p-1 text-muted-foreground border border-muted/50">
            <TabsTrigger
              className="inline-flex items-center justify-center whitespace-nowrap rounded-none px-6 py-2.5 text-sm font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:shadow-sm"
              value="task"
            >
              {t("tabs.task")}
            </TabsTrigger>
            <TabsTrigger
              className="inline-flex items-center justify-center whitespace-nowrap rounded-none px-6 py-2.5 text-sm font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:shadow-sm"
              value="submit"
            >
              {t("tabs.submit")}
            </TabsTrigger>
            <TabsTrigger
              className="inline-flex items-center justify-center whitespace-nowrap rounded-none px-6 py-2.5 text-sm font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:shadow-sm"
              value="results"
            >
              {t("tabs.results")}
            </TabsTrigger>
            <TabsTrigger
              className="inline-flex items-center justify-center whitespace-nowrap rounded-none px-6 py-2.5 text-sm font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:shadow-sm"
              value="statistics"
            >
              {t("tabs.statistics")}
            </TabsTrigger>
            <TabsTrigger
              className="inline-flex items-center justify-center whitespace-nowrap rounded-none px-6 py-2.5 text-sm font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:shadow-sm"
              value="tests"
            >
              {t("tabs.tests")}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-4">
          <TabsContent value="task">
            <ProblemDescription problemId={problem.id} />
          </TabsContent>
          <TabsContent value="submit">
            <ProblemSubmitTab
              code={code}
              language={language}
              problemId={problem.id}
              setCode={setCode}
              setLanguage={setLanguage}
            />
          </TabsContent>
          <TabsContent value="results">
            <ProblemResultsTab problemId={problem.id} />
          </TabsContent>
          <TabsContent value="statistics">
            <ProblemStatisticsTab problemId={problem.id} />
          </TabsContent>
          <TabsContent value="tests">
            <ProblemTestsTab problemId={problem.id} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
