"use client";

import {
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Code2,
  Loader,
  XCircle,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { ListPageHeader } from "@/components/list-page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProblemDifficulty } from "@/drizzle/schema";
import { useProblems } from "@/hooks/use-problems";
import type {
  getProblems,
  ProblemSortBy,
  SortDirection,
} from "@/lib/actions/problems/get-problems";
import { Link, useRouter } from "@/i18n/navigation";
import { DifficultyBadge } from "./badge";
import { ImportProblems } from "./import";

type ProblemRow = Awaited<ReturnType<typeof getProblems>>["data"][number];

interface ProblemFilters {
  my: boolean;
  difficulty?: ProblemDifficulty | "all";
  q?: string;
  page: number;
}

const difficultyOptions: ProblemDifficulty[] = ["easy", "medium", "hard"];
const ITEMS_PER_PAGE = 10;

export function ProblemsList() {
  const t = useTranslations("ProblemsPage");
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Extract State
  const page = Number(searchParams.get("page") || 1);
  const search = searchParams.get("q") || "";
  const difficulty = searchParams.get(
    "difficulty",
  ) as ProblemFilters["difficulty"];
  const my = searchParams.get("my") === "true";
  const sortBy = (searchParams.get("sortBy") || undefined) as
    | ProblemSortBy
    | undefined;
  const sortDirection = (searchParams.get("sortDirection") ||
    "desc") as SortDirection;

  // 2. Fetch Data (Server Side Filtered)
  const {
    data: queryData,
    isPending,
    isPlaceholderData,
  } = useProblems({
    page,
    pageSize: ITEMS_PER_PAGE,
    search,
    difficulty,
    my,
    sortBy,
    sortDirection,
  });

  const problems = queryData?.data || [];
  const totalCount = queryData?.total || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // URL update helper
  const updateFilter = (
    key: string,
    value: string | boolean | number | undefined,
  ) => {
    const newParams = new URLSearchParams(searchParams.toString());

    if (
      value === undefined ||
      value === false ||
      value === "" ||
      value === "all"
    ) {
      newParams.delete(key);
    } else {
      newParams.set(key, String(value));
    }

    // Reset page on filter change
    if (key !== "page") {
      newParams.delete("page");
    }

    router.replace(`?${newParams.toString()}`);
  };

  const sorting: SortingState = useMemo(
    () =>
      sortBy === "solvedBy"
        ? [{ id: "solvedByCount", desc: sortDirection === "desc" }]
        : [],
    [sortBy, sortDirection],
  );

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete("page");

    const column = next[0];
    if (!column) {
      newParams.delete("sortBy");
      newParams.delete("sortDirection");
    } else {
      newParams.set("sortBy", "solvedBy");
      newParams.set("sortDirection", column.desc ? "desc" : "asc");
    }

    router.replace(`?${newParams.toString()}`);
  };

  const columns = useMemo<ColumnDef<ProblemRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: t("Table.name"),
        enableSorting: false,
        cell: ({ row }) => (
          <Link
            className="flex items-center gap-2 font-medium hover:underline"
            href={`/problems/${row.original.slug}`}
          >
            {row.original.title}
            <DifficultyBadge difficulty={row.original.difficulty} />
          </Link>
        ),
      },
      {
        accessorKey: "solvedByCount",
        header: t("Table.solvedBy"),
        enableSorting: true,
      },
      {
        id: "solved",
        header: t("Table.solved"),
        enableSorting: false,
        cell: ({ row }) =>
          row.original.solvedByMe ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-muted-foreground" />
          ),
      },
    ],
    [t],
  );

  const table = useReactTable({
    data: problems,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    onSortingChange: handleSortingChange,
    state: { sorting },
  });

  return (
    <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col gap-4 py-8">
      <ListPageHeader
        icon={Code2}
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          <>
            <ImportProblems />
            <Link href={"/problems/new"}>
              <Button variant={"outline"}>{t("Create.button")}</Button>
            </Link>
          </>
        }
        search={{
          value: search,
          onChange: (value) => updateFilter("q", value),
          placeholder: t("Filters.searchPlaceholder"),
        }}
        filters={
          <>
            <div className="flex items-center gap-2">
              <Label htmlFor="difficulty" className="hidden sm:block">
                {t("Filters.difficulty")}
              </Label>
              <Select
                value={difficulty || "all"}
                onValueChange={(e) => updateFilter("difficulty", e)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t("Filters.Difficults.all")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("Filters.Difficults.all")}
                  </SelectItem>
                  {difficultyOptions.map((diff) => (
                    <SelectItem key={diff} value={diff}>
                      {t(`Filters.Difficults.${diff}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 border-l pl-4">
              <Checkbox
                id="my"
                checked={my}
                onCheckedChange={(v) => updateFilter("my", !!v)}
              />
              <Label htmlFor="my" className="cursor-pointer">
                {t("Filters.my")}
              </Label>
            </div>
          </>
        }
      />

      {/* List Content */}
      {isPending ? (
        <div className="flex justify-center py-8">
          <Loader className="animate-spin" />
        </div>
      ) : (
        <div className="rounded-lg border">
          {problems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-dashed">
              {t("noResults")}
            </div>
          ) : (
            <Table className={isPlaceholderData ? "opacity-50" : ""}>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <button
                            className="flex items-center gap-1 hover:text-foreground"
                            onClick={header.column.getToggleSortingHandler()}
                            type="button"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {{
                              asc: <ArrowUp className="h-3.5 w-3.5" />,
                              desc: <ArrowDown className="h-3.5 w-3.5" />,
                            }[header.column.getIsSorted() as string] ?? (
                              <ArrowUpDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    className="cursor-pointer"
                    key={row.id}
                    onClick={() =>
                      router.push(`/problems/${row.original.slug}`)
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            {t("pagination.showing", {
              from: (page - 1) * ITEMS_PER_PAGE + 1,
              to: Math.min(page * ITEMS_PER_PAGE, totalCount),
              total: totalCount,
            })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1 || isPending}
              onClick={() => updateFilter("page", page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium">
              {t("pagination.page", { page, totalPages })}
            </div>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages || isPending}
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
