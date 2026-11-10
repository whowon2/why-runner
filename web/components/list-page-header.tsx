"use client";

import type { LucideIcon } from "lucide-react";
import { Search } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { useDebouncedCallback } from "@/hooks/use-debounced";

/** Typing pause after which the search is applied (URL, page reset, query). */
export const SEARCH_DEBOUNCE_MS = 300;

interface ListPageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  action?: ReactNode;
  backHref?: string;
  search: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  filters?: ReactNode;
}

export function ListPageHeader({
  icon,
  title,
  subtitle,
  action,
  backHref,
  search,
  filters,
}: ListPageHeaderProps) {
  // The input shows local text so typing never waits on a navigation; the
  // caller's onChange (URL update + page reset) runs once per typing pause.
  const [text, setText] = useState(search.value);
  const committed = useRef(search.value);
  const onChange = search.onChange;
  const commit = useDebouncedCallback((next: string) => {
    if (next === committed.current) return;
    committed.current = next;
    onChange(next);
  }, SEARCH_DEBOUNCE_MS);

  // Back/Forward, links or a cleared filter change the value from outside:
  // show it and drop any pending commit of the old text.
  useEffect(() => {
    if (search.value === committed.current) return;
    committed.current = search.value;
    commit.cancel();
    setText(search.value);
  }, [search.value, commit]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
        action={action}
        backHref={backHref}
      />

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={search.placeholder}
            className="pl-9"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              commit(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit.flush();
            }}
          />
        </div>
        {filters && <div className="flex items-center gap-4">{filters}</div>}
      </div>
    </div>
  );
}
