"use client";

import { BarChart3, Download } from "lucide-react";
import { useFormatter } from "next-intl";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SURVEY_FORMS, type SurveyFormKey } from "@/drizzle/schemas/surveys";
import { useSurveyResults } from "@/hooks/use-surveys";
import type { LikertSummary } from "@/lib/surveys/aggregate";
import { useSurveyText } from "./use-survey-text";

const ALL = "all";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border p-4">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-2xl font-bold tabular-nums">{value}</span>
    </div>
  );
}

function LikertTable({
  rows,
  labelFor,
  showNotApplicable,
}: {
  rows: LikertSummary[];
  labelFor: (key: string, index: number) => string;
  showNotApplicable: boolean;
}) {
  const t = useSurveyText();
  const format = useFormatter();

  return (
    <div className="overflow-x-auto border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-64">{t("results.item")}</TableHead>
            {[1, 2, 3, 4, 5].map((v) => (
              <TableHead
                key={v}
                className="text-center"
                title={t(`scale.${v}`)}
              >
                {v}
              </TableHead>
            ))}
            {showNotApplicable && (
              <TableHead className="text-center">{t("scale.na")}</TableHead>
            )}
            <TableHead className="min-w-36">{t("results.mean")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={row.key}>
              <TableCell className="whitespace-normal text-sm">
                {labelFor(row.key, i)}
              </TableCell>
              {row.distribution.map((n, v) => (
                <TableCell
                  key={v}
                  className="text-center tabular-nums text-muted-foreground"
                >
                  {n || "·"}
                </TableCell>
              ))}
              {showNotApplicable && (
                <TableCell className="text-center tabular-nums text-muted-foreground">
                  {row.notApplicable || "·"}
                </TableCell>
              )}
              <TableCell>
                {row.mean === null ? (
                  "—"
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="w-8 tabular-nums font-medium">
                      {format.number(row.mean, { maximumFractionDigits: 2 })}
                    </span>
                    <span className="h-2 flex-1 bg-muted">
                      <span
                        className="block h-full bg-primary"
                        style={{ width: `${((row.mean - 1) / 4) * 100}%` }}
                      />
                    </span>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function FormResults({ form }: { form: SurveyFormKey }) {
  const t = useSurveyText();
  const format = useFormatter();
  const [entityId, setEntityId] = useState<string>(ALL);
  const { data, isPending } = useSurveyResults(
    form,
    entityId === ALL ? undefined : entityId,
  );

  if (isPending) return <Skeleton className="h-96 w-full" />;
  if (!data) return null;

  const exportHref = `/api/surveys/export?form=${form}${
    entityId === ALL ? "" : `&entityId=${entityId}`
  }`;
  const num = (v: number) => format.number(v, { maximumFractionDigits: 1 });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t("results.filterLabel")}
          </span>
          <Select value={entityId} onValueChange={setEntityId}>
            <SelectTrigger className="w-64 max-w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("results.filterAll")}</SelectItem>
              {data.entities.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button asChild variant="outline" disabled={data.count === 0}>
          <a href={exportHref}>
            <Download />
            {t("results.export")}
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={t("results.count")} value={String(data.count)} />
        <Stat
          label={t("results.susMean")}
          value={data.sus ? num(data.sus.mean) : "—"}
        />
        <Stat
          label={t("results.median")}
          value={data.sus ? num(data.sus.median) : "—"}
        />
        <Stat
          label={t("results.sd")}
          value={data.sus?.sd != null ? num(data.sus.sd) : "—"}
        />
      </div>

      {data.count === 0 ? (
        <p className="border border-dashed p-6 text-sm text-muted-foreground">
          {t("results.empty")}
        </p>
      ) : (
        <>
          {data.sus && (
            <p className="text-sm">
              SUS {num(data.sus.mean)}:{" "}
              <span className="font-semibold">
                {t(`results.bands.${data.sus.band}`)}
              </span>
            </p>
          )}

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{t("results.susItems")}</h2>
            <LikertTable
              rows={data.susItems}
              labelFor={(key, i) => `${i + 1}. ${t(`sus.${key}`)}`}
              showNotApplicable={false}
            />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">
              {t("results.featureItems")}
            </h2>
            <LikertTable
              rows={data.items}
              labelFor={(key) => t(`forms.${form}.items.${key}`)}
              showNotApplicable
            />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{t("results.profile")}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {data.profile.map((p) => (
                <div key={p.key} className="flex flex-col gap-2 border p-4">
                  <p className="text-sm font-medium">
                    {t(`profile.${p.key}.label`)}
                  </p>
                  {p.kind === "text" ? (
                    <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                      {p.values.map((v, i) => (
                        <li key={i}>{v}</li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="flex flex-col gap-1 text-sm">
                      {Object.entries(p.counts).map(([option, n]) => (
                        <li key={option} className="flex justify-between gap-4">
                          <span>{t(`profile.${p.key}.options.${option}`)}</span>
                          <span className="tabular-nums text-muted-foreground">
                            {n}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">
              {t("results.openAnswers")}
            </h2>
            {data.open.map((q) => (
              <div key={q.key} className="flex flex-col gap-2">
                <p className="text-sm font-medium">{t(`open.${q.key}`)}</p>
                {q.answers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("results.noOpenAnswers")}
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {q.answers.map((a, i) => (
                      <li
                        key={i}
                        className="whitespace-pre-wrap border-l-2 pl-3 text-sm"
                      >
                        {a}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}

export function SurveyResults() {
  const t = useSurveyText();

  return (
    <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col gap-8 py-8">
      <PageHeader
        icon={BarChart3}
        title={t("results.title")}
        subtitle={t("results.subtitle")}
      />
      <Tabs defaultValue={SURVEY_FORMS[0]} className="gap-6">
        <TabsList className="flex h-auto w-full flex-wrap justify-start">
          {SURVEY_FORMS.map((form) => (
            <TabsTrigger key={form} value={form}>
              {t(`formLabels.${form}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        {SURVEY_FORMS.map((form) => (
          <TabsContent key={form} value={form}>
            <FormResults form={form} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
