"use client";

import type { LucideIcon } from "lucide-react";
import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";

interface ListPageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  action?: ReactNode;
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
  search,
  filters,
}: ListPageHeaderProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
        action={action}
      />

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={search.placeholder}
            className="pl-9"
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
          />
        </div>
        {filters && <div className="flex items-center gap-4">{filters}</div>}
      </div>
    </div>
  );
}
