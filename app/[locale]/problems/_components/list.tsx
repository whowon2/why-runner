"use client";

import type { User } from "better-auth";
import { Loader } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
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
import type { ProblemDifficulty } from "@/drizzle/schema";
import { useProblems } from "@/hooks/use-problems";
import { Link, useRouter } from "@/i18n/navigation";
import { DifficultyBadge } from "./badge";

interface ProblemFilters {
  my: boolean;
  difficulty?: ProblemDifficulty | "all";
}

const difficultyOptions: ProblemDifficulty[] = ["easy", "medium", "hard"];

export function ProblemsList({ user }: { user: User }) {
  const t = useTranslations("ProblemsPage");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract filters from query
  const filters: ProblemFilters = {
    my: searchParams.get("my") === "true",
    difficulty: searchParams.get("difficulty") as ProblemFilters["difficulty"],
  };

  const { data: problems, isPending } = useProblems();

  // URL update helper
  const updateFilter = (
    key: keyof ProblemFilters,
    value: string | boolean | undefined,
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

    router.replace(`?${newParams.toString()}`);
  };

  const filteredProblems = useMemo(() => {
    if (!problems) return [];

    return problems.filter((p) => {
      if (filters.my && p.createdBy !== user.id) return false;
      if (filters.difficulty && p.difficulty !== filters.difficulty)
        return false;
      return true;
    });
  }, [problems, filters.difficulty, filters.my, user.id]);

  return (
    <div className="w-full max-w-7xl flex-1">
      <div className="flex justify-between">
        <h1 className="font-bold text-2xl">Problems</h1>
        <Link href={"/problems/new"}>
          <Button variant={"outline"}>{t("Create.button")}</Button>
        </Link>
      </div>

      {/* Filter UI */}
      <div className="flex items-center gap-4 p-4 border-b mt-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="my"
            checked={filters.my}
            onCheckedChange={(v) => updateFilter("my", !!v)}
          />
          <Label htmlFor="my">{t("Filters.my")}</Label>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="difficulty">{t("Filters.difficulty")}</Label>
          <Select
            value={filters.difficulty}
            onValueChange={(e) => updateFilter("difficulty", e)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("Filters.Difficults.all")}>
                {t(`Filters.Difficults.${filters.difficulty}`)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("Filters.Difficults.all")}</SelectItem>
              {difficultyOptions.map((difficulty) => (
                <SelectItem key={difficulty} value={difficulty}>
                  {t(`Filters.Difficults.${difficulty}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filtered Problem List */}
      {isPending ? (
        <Loader className="animate-spin w-full mt-8" />
      ) : (
        <div>
          {filteredProblems.map((problem) => (
            <Link href={`/problems/${problem.id}`} key={problem.id}>
              <div className="my-2 flex justify-between rounded-lg border p-4">
                <h3 className="font-bold">{problem.title}</h3>
                <DifficultyBadge difficulty={problem.difficulty} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
