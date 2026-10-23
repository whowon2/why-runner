import { expect, test } from "bun:test";
import { toCsv } from "./csv";
import { SURVEY_DEFINITIONS } from "./forms";

test("escapes quotes, commas and newlines and has no user columns", () => {
  const csv = toCsv(SURVEY_DEFINITIONS.lesson_student, [
    {
      id: "r1",
      formVersion: 1,
      entityId: "l1",
      entityName: "Lista 1",
      createdAt: new Date("2026-10-01T12:00:00Z"),
      susScore: 72.5,
      answers: {
        profile: { course: 'CC, "3º"' },
        sus: { sus1: 4 },
        items: { aiHints: "na" },
        open: { helped: "linha 1\nlinha 2" },
      },
    },
  ]);
  const [header, row] = csv.replace("﻿", "").split("\r\n");
  expect(header).not.toMatch(/user|email|username/);
  expect(row).toContain('"CC, ""3º"""');
  expect(row).toContain('"linha 1\nlinha 2"');
  expect(row).toContain(",na,");
});
