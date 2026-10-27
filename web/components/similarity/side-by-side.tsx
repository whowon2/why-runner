"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { MatchRegion } from "@/lib/similarity/compare";
import { cn } from "@/lib/utils";

// Region i gets REGION_COLORS[i % n] on both sides, so a pair of matched
// blocks reads as one color across the two columns.
const REGION_COLORS = [
  "bg-rose-500/25",
  "bg-amber-500/25",
  "bg-emerald-500/25",
  "bg-sky-500/25",
  "bg-violet-500/25",
  "bg-lime-500/25",
  "bg-orange-500/25",
  "bg-cyan-500/25",
  "bg-fuchsia-500/25",
  "bg-teal-500/25",
];

type Segment = { text: string; region: number | null };

// Splits `code` at the (non-overlapping) ranges; `ranges[i]` is region i.
function segments(code: string, ranges: [number, number][]): Segment[] {
  const order = ranges
    .map((range, region) => ({ range, region }))
    .sort((x, y) => x.range[0] - y.range[0]);
  const out: Segment[] = [];
  let at = 0;
  for (const { range, region } of order) {
    const [start, end] = range;
    if (start > at) out.push({ text: code.slice(at, start), region: null });
    out.push({ text: code.slice(start, end), region });
    at = end;
  }
  if (at < code.length) out.push({ text: code.slice(at), region: null });
  return out;
}

export type SideBySideSide = {
  name: string;
  code: string;
  coverage: number;
};

export function SideBySide({
  a,
  b,
  regions,
}: {
  a: SideBySideSide;
  b: SideBySideSide;
  regions: MatchRegion[];
}) {
  const t = useTranslations("Similarity.Compare");
  const prefix = useId();
  const [active, setActive] = useState<number | null>(null);

  const jumpTo = (side: "a" | "b", region: number) => {
    document
      .getElementById(`${prefix}-${side}-${region}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const column = (side: "a" | "b", data: SideBySideSide) => {
    const other = side === "a" ? "b" : "a";
    return (
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-semibold">{data.name}</span>
          <Badge variant="outline">
            {t("coverage", { percent: Math.round(data.coverage * 100) })}
          </Badge>
        </div>
        <pre className="max-h-[70vh] overflow-auto border bg-muted/30 p-3 font-mono text-xs leading-relaxed">
          {segments(
            data.code,
            regions.map((r) => r[side]),
          ).map((seg, i) =>
            seg.region === null ? (
              <span key={i}>{seg.text}</span>
            ) : (
              <span
                className={cn(
                  "cursor-pointer",
                  REGION_COLORS[seg.region % REGION_COLORS.length],
                  active === seg.region && "outline outline-1 outline-primary",
                )}
                id={`${prefix}-${side}-${seg.region}`}
                key={i}
                onClick={() => jumpTo(other, seg.region as number)}
                onMouseEnter={() => setActive(seg.region)}
                onMouseLeave={() => setActive(null)}
              >
                {seg.text}
              </span>
            ),
          )}
        </pre>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-sm">
        {t("regions", { count: regions.length })} · {t("hint")}
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {column("a", a)}
        {column("b", b)}
      </div>
    </div>
  );
}
