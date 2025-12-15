"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useContests } from "@/hooks/use-contests";
import { Link, useRouter } from "@/i18n/navigation";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { ContestCard } from "./card";

const ITEMS_PER_PAGE = 5;

export function ContestList() {
  const t = useTranslations("ContestsPage");
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Extract State
  const page = Number(searchParams.get("page") || 1);
  const search = searchParams.get("q") || "";

  // 2. Fetch Data
  const {
    data: queryData,
    isPending,
    isPlaceholderData,
  } = useContests({
    page,
    pageSize: ITEMS_PER_PAGE,
    search,
  });

  const contests = queryData?.data || [];
  const totalCount = queryData?.total || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // 3. Update URL Helper
  const updateFilter = (key: string, value: string | number | undefined) => {
    const newParams = new URLSearchParams(searchParams.toString());

    if (value === undefined || value === "") {
      newParams.delete(key);
    } else {
      newParams.set(key, String(value));
    }

    // Reset page to 1 if search changes
    if (key === "q") {
      newParams.delete("page");
    }

    router.replace(`?${newParams.toString()}`);
  };

  return (
    <div className="w-full max-w-7xl flex-1 flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="font-bold text-2xl">{t("title")}</h1>
          <Button asChild>
            <Link href={"/user?tab=contests"}>My Contests</Link>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contests..."
            className="pl-9 max-w-md"
            defaultValue={search}
            onBlur={(e) => updateFilter("q", e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && updateFilter("q", e.currentTarget.value)
            }
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {isPending ? (
          <div className="flex flex-col gap-4 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {contests.length === 0 ? (
              <div className="flex h-48 items-center justify-center border rounded-lg border-dashed">
                <p className="text-muted-foreground">{t("notFound")}</p>
              </div>
            ) : (
              <div
                className={`flex flex-col gap-4 ${
                  isPlaceholderData ? "opacity-50" : ""
                }`}
              >
                {contests.map((contest) => (
                  <ContestCard contest={contest} key={contest.id} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {!isPending && totalCount > 0 && (
        <div className="flex items-center justify-between py-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing <strong>{(page - 1) * ITEMS_PER_PAGE + 1}</strong>-
            <strong>{Math.min(page * ITEMS_PER_PAGE, totalCount)}</strong> of{" "}
            <strong>{totalCount}</strong>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1}
              onClick={() => updateFilter("page", page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages}
              onClick={() => updateFilter("page", page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
