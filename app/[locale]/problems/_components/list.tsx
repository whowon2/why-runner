"use client";

import { ChevronLeft, ChevronRight, Loader, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProblemDifficulty } from "@/drizzle/schema";
import { useProblems } from "@/hooks/use-problems";
import { Link, useRouter } from "@/i18n/navigation";
import { DifficultyBadge } from "./badge";
import { ImportProblems } from "./import";

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

  return (
    <div className="w-full max-w-7xl flex-1 flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="font-bold text-2xl">Problems</h1>
        <div className="flex gap-2">
          <ImportProblems />
          <Link href={"/problems/new"}>
            <Button variant={"outline"}>{t("Create.button")}</Button>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("Filters.searchPlaceholder") || "Search problems..."}
            className="pl-9"
            defaultValue={search} // Use defaultValue to prevent re-render on every keystroke
            // Ideally, debounce this updateFilter call
            onBlur={(e) => updateFilter("q", e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && updateFilter("q", e.currentTarget.value)
            }
          />
        </div>

        <div className="flex items-center gap-4">
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
        </div>
      </div>

      {/* List Content */}
      {isPending ? (
        <div className="flex justify-center py-8">
          <Loader className="animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {problems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
              No problems found matching your filters.
            </div>
          ) : (
            <div className={isPlaceholderData ? "opacity-50" : ""}>
              {problems.map((problem) => (
                <Link href={`/problems/${problem.id}`} key={problem.id}>
                  <div className="flex justify-between items-center rounded-lg border p-4 hover:bg-muted/50 transition-colors my-2">
                    <h3 className="font-bold">{problem.title}</h3>
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            Showing <strong>{(page - 1) * ITEMS_PER_PAGE + 1}</strong>-
            <strong>{Math.min(page * ITEMS_PER_PAGE, totalCount)}</strong> of{" "}
            <strong>{totalCount}</strong>
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
              Page {page} of {totalPages}
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
