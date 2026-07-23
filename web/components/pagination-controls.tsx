"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

export function PaginationControls({
  page,
  totalPages,
  showingLabel,
  pageLabel,
  onPrev,
  onNext,
  disabled,
  className,
}: {
  page: number;
  totalPages: number;
  showingLabel: string;
  pageLabel: string;
  onPrev: () => void;
  onNext: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4",
        className,
      )}
    >
      <div className="text-sm font-medium text-muted-foreground">
        {showingLabel}
      </div>
      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="outline"
              size="icon"
              disabled={disabled || page <= 1}
              onClick={onPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </PaginationItem>
          <PaginationItem>
            <div className="text-sm font-medium min-w-24 text-center px-2">
              {pageLabel}
            </div>
          </PaginationItem>
          <PaginationItem>
            <Button
              variant="outline"
              size="icon"
              disabled={disabled || page >= totalPages}
              onClick={onNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
