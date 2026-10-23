import { SUS_KEYS, type SurveyDefinition } from "./forms";

type CsvRow = {
  id: string;
  formVersion: number;
  entityId: string | null;
  entityName: string;
  createdAt: Date;
  susScore: number;
  answers: Record<string, unknown>;
};

function cell(value: unknown): string {
  const text = Array.isArray(value)
    ? value.join(";")
    : value === undefined || value === null
      ? ""
      : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function get(answers: Record<string, unknown>, section: string, key: string) {
  const s = answers[section];
  return s && typeof s === "object" ? (s as Record<string, unknown>)[key] : "";
}

/**
 * Anonymous CSV of one form's responses: no user id, name or email. Column
 * order follows the form definition. Starts with a BOM so spreadsheet apps
 * read the Portuguese text as UTF-8.
 */
export function toCsv(definition: SurveyDefinition, rows: CsvRow[]): string {
  const header = [
    "response_id",
    "form_version",
    "entity_id",
    "entity_name",
    "submitted_at",
    "sus_score",
    ...definition.profile.map((q) => `profile_${q.key}`),
    ...SUS_KEYS,
    ...definition.items.map((i) => `item_${i.key}`),
    ...definition.open.map((q) => `open_${q.key}`),
  ];

  const lines = rows.map((r) =>
    [
      r.id,
      r.formVersion,
      r.entityId,
      r.entityName,
      r.createdAt.toISOString(),
      r.susScore,
      ...definition.profile.map((q) => get(r.answers, "profile", q.key)),
      ...SUS_KEYS.map((k) => get(r.answers, "sus", k)),
      ...definition.items.map((i) => get(r.answers, "items", i.key)),
      ...definition.open.map((q) => get(r.answers, "open", q.key)),
    ]
      .map(cell)
      .join(","),
  );

  return `﻿${[header.join(","), ...lines].join("\r\n")}\r\n`;
}
