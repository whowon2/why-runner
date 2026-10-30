"use client";

import { ArrowLeft, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { ListPageHeader } from "@/components/list-page-header";
import { PaginationControls } from "@/components/pagination-controls";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";

export const ADMIN_PAGE_SIZE = 20;

/** Search and page of an admin list, kept in the URL. */
export function useAdminListState() {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  return {
    params: { page, pageSize: ADMIN_PAGE_SIZE, search },
    setPage,
    setSearch: (value: string) => {
      setSearch(value || null);
      setPage(1);
    },
  };
}

/** Shared shell of the admin list pages: header with search, table, pagination. */
export function AdminList({
  icon,
  title,
  subtitle,
  searchPlaceholder,
  state,
  isPending,
  count,
  total,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  state: ReturnType<typeof useAdminListState>;
  isPending: boolean;
  count: number;
  total: number;
  children: ReactNode;
}) {
  const t = useTranslations("AdminPage");
  const { page } = state.params;
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 py-8">
      <ListPageHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
        action={
          <Button asChild variant="outline">
            <Link href="/admin">
              <ArrowLeft className="size-4" />
              {t("backToAdmin")}
            </Link>
          </Button>
        }
        search={{
          value: state.params.search,
          onChange: state.setSearch,
          placeholder: searchPlaceholder,
        }}
      />

      {isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : count === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="border">{children}</div>
      )}

      <PaginationControls
        page={page}
        totalPages={totalPages}
        showingLabel={t("showing", { count, total })}
        pageLabel={t("page", { page, totalPages })}
        onPrev={() => state.setPage(page - 1)}
        onNext={() => state.setPage(page + 1)}
        disabled={isPending}
      />
    </div>
  );
}
