"use client";

import { ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useProblems } from "@/hooks/use-problems";
import { DifficultyBadge } from "./badge";

/**
 * Searchable problem combobox used to add a problem to a contest or an
 * exercise to a lesson. Lists what `getProblems` lets the user see
 * (published problems plus their own drafts), minus `excludeIds`.
 */
export function ProblemPicker({
  excludeIds,
  onSelect,
  disabled,
  placeholder,
}: {
  excludeIds: string[];
  onSelect: (problemId: string) => void;
  disabled?: boolean;
  placeholder: string;
}) {
  const t = useTranslations("ProblemPicker");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timeout);
  }, [search]);
  const { data: problems, isFetching: isSearching } = useProblems({
    page: 1,
    pageSize: 20,
    search: debouncedSearch || undefined,
  });

  function handleSelect(problemId: string) {
    setOpen(false);
    setSearch("");
    onSelect(problemId);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="flex-1 justify-between font-normal text-muted-foreground"
        >
          {placeholder}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) min-w-80 p-0"
        align="start"
      >
        {/* Search runs server-side on title and code, so cmdk's own filter is off. */}
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t("searchPlaceholder")}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {isSearching ? t("searching") : t("empty")}
            </CommandEmpty>
            {problems?.data
              ?.filter((p) => !excludeIds.includes(p.id))
              .map((p) => (
                <CommandItem
                  key={p.id}
                  value={p.id}
                  onSelect={() => handleSelect(p.id)}
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    [{p.code}]
                  </span>
                  <span className="min-w-0 flex-1 truncate">{p.title}</span>
                  {p.creatorName && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {t("by")} {p.creatorName}
                    </span>
                  )}
                  <DifficultyBadge difficulty={p.difficulty} />
                </CommandItem>
              ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
