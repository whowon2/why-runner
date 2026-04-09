"use client";

import { ChevronLeft, ChevronRight, Search, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 py-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <span className="p-2 bg-indigo-500/10 rounded-xl">
              <Trophy className="w-8 h-8 text-indigo-500" />
            </span>
            <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              {t("title") || "Contests"}
            </span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Find the best contests and test your skills.
          </p>
        </div>
        <Button
          asChild
          className="shrink-0 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/25 rounded-full px-6 transition-all hover:scale-105 active:scale-95 border-0"
        >
          <Link href={"/user?tab=contests"}>My Contests</Link>
        </Button>
      </div>

      {/* Search and Filters Bar */}
      <div className="w-full flex inset-y-0 gap-3 flex-col sm:flex-row relative group z-20">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <Input
            placeholder="Search contests by name..."
            className="pl-11 h-12 text-base rounded-2xl bg-muted/30 border-muted-foreground/20 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500 shadow-sm transition-all w-full"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value || null);
              setPage(1);
            }}
          />
        </div>
        <div className="sm:w-[180px] shrink-0">
          <Select
            value={status}
            onValueChange={(val) => {
              setStatus(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full h-12! rounded-2xl bg-muted/30 border-muted-foreground/20 focus:ring-indigo-500/50">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-muted-foreground/20 p-1">
              <SelectItem value="all" className="rounded-lg">
                Any Status
              </SelectItem>
              <SelectItem
                value="upcoming"
                className="rounded-lg text-emerald-600 dark:text-emerald-400"
              >
                Upcoming
              </SelectItem>
              <SelectItem
                value="active"
                className="rounded-lg text-amber-600 dark:text-amber-500"
              >
                Active
              </SelectItem>
              <SelectItem value="past" className="rounded-lg text-neutral-500">
                Past
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-[400px]">
        {isPending ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-40 w-full rounded-2xl bg-muted/40"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {contests.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-3xl bg-muted/10">
                <div className="p-4 bg-muted/30 rounded-full mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">
                  No contests found
                </h3>
                <p className="text-muted-foreground max-w-sm">
                  {search
                    ? `We couldn't find any contests matching "${search}". Try adjusting your search.`
                    : t("notFound")?.replace(
                        "not found",
                        "No contests available yet.",
                      ) || "No contests available yet."}
                </p>
                {search && (
                  <Button
                    variant="outline"
                    className="mt-6 rounded-full"
                    onClick={() => {
                      setSearch(null);
                      setPage(1);
                    }}
                  >
                    Clear Search
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
                  <div
                    key={contest.id}
                    className="transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 rounded-2xl"
                  >
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
          <div className="text-sm font-medium text-muted-foreground bg-muted/30 px-4 py-2 rounded-full">
            Showing{" "}
            <span className="text-foreground">
              {(page - 1) * ITEMS_PER_PAGE + 1}
            </span>{" "}
            to{" "}
            <span className="text-foreground">
              {Math.min(page * ITEMS_PER_PAGE, totalCount)}
            </span>{" "}
            of <span className="text-foreground">{totalCount}</span> contests
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 dark:hover:bg-indigo-950/30"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-sm font-semibold min-w-24 text-center">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 dark:hover:bg-indigo-950/30"
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
