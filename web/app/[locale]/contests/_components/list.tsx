"use client";

import { ChevronLeft, ChevronRight, Search, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { ListPageHeader } from "@/components/list-page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useContests } from "@/hooks/use-contests";
import { Link } from "@/i18n/navigation";
import { ContestCard } from "./card";
import { CreateContestButton } from "./create/button";

const ITEMS_PER_PAGE = 5;

export function ContestList() {
  const t = useTranslations("ContestsPage");

  // 1. Extract State using nuqs
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({ shallow: false }),
  );
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault("all").withOptions({ shallow: false }),
  );

  // 2. Fetch Data
  const {
    data: queryData,
    isPending,
    isPlaceholderData,
  } = useContests({
    page,
    pageSize: ITEMS_PER_PAGE,
    search,
    // @ts-expect-error - Let backend handle standard "all", "upcoming", "active", "past"
    status,
  });

  const contests = queryData?.data || [];
  const totalCount = queryData?.total || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 py-8">
      <ListPageHeader
        icon={Trophy}
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          <>
            <Button asChild variant="outline">
              <Link href={"/user?tab=contests"}>{t("myContests")}</Link>
            </Button>
            <CreateContestButton />
          </>
        }
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value || null);
            setPage(1);
          },
          placeholder: t("searchPlaceholder"),
        }}
        filters={
          <div className="sm:w-[180px] shrink-0">
            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("filter.placeholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filter.all")}</SelectItem>
                <SelectItem value="upcoming">{t("filter.upcoming")}</SelectItem>
                <SelectItem value="active">{t("filter.active")}</SelectItem>
                <SelectItem value="past">{t("filter.past")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Content */}
      <div className="flex-1 min-h-[400px]">
        {isPending ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-40 w-full rounded-none bg-muted/40"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {contests.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-none bg-muted/10">
                <div className="p-4 bg-muted/30 rounded-none mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">
                  {t("noContestsFound")}
                </h3>
                <p className="text-muted-foreground max-w-sm">
                  {search
                    ? t("noContestsSearch", { search })
                    : t("noContestsAvailable")}
                </p>
                {search && (
                  <Button
                    variant="outline"
                    className="mt-6 rounded-none"
                    onClick={() => {
                      setSearch(null);
                      setPage(1);
                    }}
                  >
                    {t("clearSearch")}
                  </Button>
                )}
              </div>
            ) : (
              <div
                className={`flex flex-col gap-4 transition-opacity duration-300 ${
                  isPlaceholderData ? "opacity-60 saturate-50" : ""
                }`}
              >
                {contests.map((contest) => (
                  <div key={contest.id} className="transition-all rounded-none">
                    <ContestCard contest={contest} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {!isPending && totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between py-6 border-t gap-4">
          <div className="text-sm font-medium text-muted-foreground bg-muted/30 px-4 py-2 rounded-none">
            {t("pagination.showing", {
              from: (page - 1) * ITEMS_PER_PAGE + 1,
              to: Math.min(page * ITEMS_PER_PAGE, totalCount),
              total: totalCount,
            })}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="rounded-none h-10 w-10 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 dark:hover:bg-indigo-950/30"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-sm font-semibold min-w-24 text-center">
              {t("pagination.page", { page, totalPages })}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-none h-10 w-10 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 dark:hover:bg-indigo-950/30"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
