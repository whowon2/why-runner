"use client";

import { FileCode } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useProblems } from "@/hooks/use-problems";
import { Link } from "@/i18n/navigation";
import { CreateProblemButton } from "../../problems/_components/create-button";

export function MyProblems() {
  const t = useTranslations("UserPage.MyProblems");
  const { data, isLoading } = useProblems({
    page: 1,
    pageSize: 50,
    my: true,
  });

  const problems = data?.data || [];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-neutral-900 to-neutral-500 dark:from-neutral-50 dark:to-neutral-400">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-lg">{t("subtitle")}</p>
        </div>
        <div className="shrink-0">
          <CreateProblemButton />
        </div>
      </div>

      <Separator className="w-full h-px bg-linear-to-r from-border to-transparent" />

      {isLoading ? (
        <div className="flex justify-center p-14">
          <span className="animate-pulse">{t("loading")}</span>
        </div>
      ) : problems.length === 0 ? (
        <Card className="border-dashed shadow-sm bg-muted/20 transition-all hover:bg-muted/30 hover:shadow-md border-2">
          <CardContent className="flex flex-col items-center justify-center p-14 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-none bg-indigo-500/10 mb-6 transition-transform hover:scale-110 hover:bg-indigo-500/20 cursor-default">
              <FileCode className="h-10 w-10 text-indigo-500" />
            </div>
            <CardTitle className="mb-3 text-2xl font-semibold">
              {t("emptyTitle")}
            </CardTitle>
            <CardDescription className="max-w-md mx-auto mb-8 text-base">
              {t("emptyDescription")}
            </CardDescription>

            <div className="relative group">
              <div className="absolute -inset-1 blur-lg bg-linear-to-r from-indigo-500 to-cyan-500 opacity-20 group-hover:opacity-40 transition duration-500 rounded-lg" />
              <div className="relative">
                <CreateProblemButton />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((prob) => (
            <Card key={prob.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3
                      className="font-bold text-lg line-clamp-1"
                      title={prob.title}
                    >
                      {prob.title}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {prob.status === "draft" && (
                        <span className="px-2 py-0.5 rounded-none text-xs font-semibold uppercase tracking-wide bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          {t("draftBadge")}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-none text-xs font-semibold uppercase tracking-wide ${
                          prob.difficulty === "easy"
                            ? "bg-green-100/50 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                            : prob.difficulty === "medium"
                              ? "bg-orange-100/50 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"
                              : "bg-red-100/50 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                        }`}
                      >
                        {prob.difficulty}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {prob.description}
                  </p>
                </div>
                <div className="pt-2 border-t">
                  <Link
                    href={
                      prob.status === "draft"
                        ? `/problems/${prob.slug}?tab=edit`
                        : `/problems/${prob.slug}`
                    }
                  >
                    <Button variant="secondary" className="w-full">
                      {prob.status === "draft"
                        ? t("editDraft")
                        : t("viewDetails")}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
