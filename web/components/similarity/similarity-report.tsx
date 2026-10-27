"use client";

import { Info, ScanSearch } from "lucide-react";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isActionError } from "@/lib/action-result";
import { PICK_MODES, type PickMode } from "@/lib/similarity/pick";
import { MAX_REPORT_PAIRS } from "@/lib/similarity/report";
import type { SimilarityResult } from "@/lib/similarity/run";
import { MAX_REPORT_SUBMISSIONS } from "@/lib/similarity/run";
import { cn } from "@/lib/utils";
import { SideBySide } from "./side-by-side";

const THRESHOLDS = [30, 50, 70, 90];
const DEFAULT_THRESHOLD = 50;

/** URL state shared by both report pages: `?pick=best&min=70&pair=<a>_<b>`. */
export function usePickParam() {
  const [pick, setPick] = useQueryState(
    "pick",
    parseAsStringLiteral(PICK_MODES).withDefault("best"),
  );
  return [pick, setPick] as const;
}

type ReportUser = { id: string; name: string };

const percent = (x: number) => `${Math.round(x * 100)}%`;

export function SimilarityReport({
  data,
  isPending,
  error,
  filters,
}: {
  data: SimilarityResult<ReportUser> | undefined;
  isPending: boolean;
  error: Error | null;
  /** Extra selectors shown before the pick/threshold ones (contest problem picker). */
  filters?: ReactNode;
}) {
  const t = useTranslations("Similarity");
  const [pick, setPick] = usePickParam();
  const [min, setMin] = useQueryState(
    "min",
    parseAsInteger.withDefault(DEFAULT_THRESHOLD),
  );
  const [pairKey, setPairKey] = useQueryState("pair", parseAsString);

  const visible = data?.pairs.filter((p) => p.similarity * 100 >= min) ?? [];
  const byId = new Map(data?.submissions.map((s) => [s.id, s]));
  const selected = visible.find((p) => `${p.a}_${p.b}` === pairKey);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        {filters}
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">{t("pick.label")}</span>
          <Select
            onValueChange={(v) => {
              setPick(v as PickMode);
              setPairKey(null);
            }}
            value={pick}
          >
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PICK_MODES.map((mode) => (
                <SelectItem key={mode} value={mode}>
                  {t(`pick.${mode}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">{t("threshold")}</span>
          <Select onValueChange={(v) => setMin(Number(v))} value={String(min)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(THRESHOLDS.includes(min) ? THRESHOLDS : [...THRESHOLDS, min])
                .sort((x, y) => x - y)
                .map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    ≥ {value}%
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </label>
      </div>

      <p className="flex items-start gap-2 text-muted-foreground text-sm">
        <Info className="mt-0.5 size-4 shrink-0" />
        {t("disclaimer")}
      </p>

      {isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <div className="border py-12 text-center text-muted-foreground">
          {isActionError(error, "PARSONS_NOT_SUPPORTED")
            ? t("parsonsNotSupported")
            : error.message}
        </div>
      ) : !data ? null : (
        <>
          {data.truncatedSubmissions && (
            <p className="text-amber-600 text-sm dark:text-amber-400">
              {t("truncatedSubmissions", { count: MAX_REPORT_SUBMISSIONS })}
            </p>
          )}
          {data.truncatedPairs && (
            <p className="text-amber-600 text-sm dark:text-amber-400">
              {t("truncatedPairs", { count: MAX_REPORT_PAIRS })}
            </p>
          )}

          {visible.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ScanSearch />
                </EmptyMedia>
                <EmptyTitle>{t("empty.title")}</EmptyTitle>
                <EmptyDescription>
                  {t("empty.description", {
                    min,
                    count: data.submissions.length,
                  })}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("columns.students")}</TableHead>
                    <TableHead>{t("columns.language")}</TableHead>
                    <TableHead className="text-right">
                      {t("columns.similarity")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("columns.coverage")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((p) => {
                    const key = `${p.a}_${p.b}`;
                    const a = byId.get(p.a);
                    const b = byId.get(p.b);
                    return (
                      <TableRow
                        className={cn(
                          "cursor-pointer",
                          key === pairKey && "bg-muted",
                        )}
                        key={key}
                        onClick={() => setPairKey(key === pairKey ? null : key)}
                      >
                        <TableCell className="font-medium">
                          {a?.user.name} · {b?.user.name}
                        </TableCell>
                        <TableCell>
                          {a?.language && (
                            <Badge variant="outline">{a.language}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {percent(p.similarity)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground tabular-nums">
                          {percent(p.coverageA)} / {percent(p.coverageB)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {selected && (
            <SideBySide
              a={{
                name: byId.get(selected.a)?.user.name ?? "",
                code: byId.get(selected.a)?.code ?? "",
                coverage: selected.coverageA,
              }}
              b={{
                name: byId.get(selected.b)?.user.name ?? "",
                code: byId.get(selected.b)?.code ?? "",
                coverage: selected.coverageB,
              }}
              key={pairKey}
              regions={selected.regions}
            />
          )}
        </>
      )}
    </div>
  );
}
