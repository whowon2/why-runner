"use client";

import { Search, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { ListPageHeader } from "@/components/list-page-header";
import { PaginationControls } from "@/components/pagination-controls";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Search />
                  </EmptyMedia>
                  <EmptyTitle>{t("noContestsFound")}</EmptyTitle>
                  <EmptyDescription>
                    {search
                      ? t("noContestsSearch", { search })
                      : t("noContestsAvailable")}
                  </EmptyDescription>
                </EmptyHeader>
                {search && (
                  <EmptyContent>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearch(null);
                        setPage(1);
                      }}
                    >
                      {t("clearSearch")}
                    </Button>
                  </EmptyContent>
                )}
              </Empty>
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
        <>
          <Separator />
          <PaginationControls
            className="pt-6"
            page={page}
            totalPages={totalPages}
            showingLabel={t("pagination.showing", {
              from: (page - 1) * ITEMS_PER_PAGE + 1,
              to: Math.min(page * ITEMS_PER_PAGE, totalCount),
              total: totalCount,
            })}
            pageLabel={t("pagination.page", { page, totalPages })}
            onPrev={() => setPage(page - 1)}
            onNext={() => setPage(page + 1)}
          />
        </>
      )}
    </div>
  );
}
