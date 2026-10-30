#!/usr/bin/env bun
// Checks that every Postgres enum the judge decodes with sqlx
// (`#[sqlx(type_name = "...")]` enums in judge/src/models.rs) has the exact
// same label set as the Drizzle `pgEnum` of the same type name in
// web/drizzle/schemas/. The two sides are maintained by hand; a mismatch
// otherwise only surfaces at runtime as an sqlx decode error in the judge.
//
// Enums are paired by Postgres type name and labels are derived with sqlx's
// own rename rules, so adding a value (on both sides) needs no change here.
//
// Usage: bun scripts/check-enum-sync.ts   (exit 1 on mismatch)

import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const RUST_MODELS = join(ROOT, "judge/src/models.rs");
const DRIZZLE_DIR = join(ROOT, "web/drizzle/schemas");

// Must always be found on both sides, so a parser miss can't pass silently.
const REQUIRED = [
  "submission_status",
  "language",
  "problem_constraint_kind",
  "structural_constraint_rule_type",
  "code_run_status",
];

// --- sqlx rename rules (sqlx-macros-core `RenameAll`, which uses `heck`) ---

function words(ident: string): string[] {
  return ident
    .split(/[^A-Za-z0-9]+/)
    .flatMap((part) =>
      // aB -> a|B, ABc -> A|Bc (acronym boundary), as heck splits words.
      part
        .replace(/([a-z0-9])([A-Z])/g, "$1\u0000$2")
        .replace(/([A-Z])([A-Z][a-z])/g, "$1\u0000$2")
        .split("\u0000"),
    )
    .filter(Boolean);
}

const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();

const RENAME_RULES: Record<string, (ident: string) => string> = {
  lowercase: (s) => s.toLowerCase(),
  UPPERCASE: (s) => s.toUpperCase(),
  snake_case: (s) => words(s).join("_").toLowerCase(),
  SCREAMING_SNAKE_CASE: (s) => words(s).join("_").toUpperCase(),
  "kebab-case": (s) => words(s).join("-").toLowerCase(),
  camelCase: (s) =>
    words(s)
      .map((w, i) => (i === 0 ? w.toLowerCase() : cap(w)))
      .join(""),
  PascalCase: (s) => words(s).map(cap).join(""),
};

// --- Rust side ---

type EnumLabels = { name: string; labels: string[]; where: string };

function stripLineComments(src: string): string {
  return src.replace(/\/\/[^\n]*/g, "");
}

function attrString(attrs: string, key: string): string | undefined {
  return attrs.match(new RegExp(`\\b${key}\\s*=\\s*"([^"]*)"`))?.[1];
}

function parseRust(path: string): Map<string, EnumLabels> {
  const src = stripLineComments(readFileSync(path, "utf8"));
  const out = new Map<string, EnumLabels>();
  const enumRe = /(?:pub(?:\([^)]*\))?\s+)?enum\s+(\w+)\s*\{([^}]*)\}/g;
  let prevEnd = 0;

  for (const m of src.matchAll(enumRe)) {
    // The enum's own attributes sit between the previous item's end
    // (`}` or `;`) and the `enum` keyword.
    const before = src.slice(prevEnd, m.index);
    prevEnd = m.index + m[0].length;
    const lastItemEnd = Math.max(before.lastIndexOf("}"), before.lastIndexOf(";"));
    const attrBlock = before.slice(lastItemEnd + 1);

    const sqlxAttrs = [...attrBlock.matchAll(/#\[\s*sqlx\s*\(([\s\S]*?)\)\s*\]/g)]
      .map((a) => a[1])
      .join(",");
    const typeName = attrString(sqlxAttrs, "type_name");
    if (!typeName) continue;

    const rule = attrString(sqlxAttrs, "rename_all");
    const rename = rule === undefined ? (s: string) => s : RENAME_RULES[rule];
    if (!rename) fail(`${m[1]}: unsupported sqlx rename_all = "${rule}"`);

    const labels = m[2]
      .split(",")
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) => {
        const variant = chunk.replace(/#\[[\s\S]*?\]/g, "").trim().match(/^(\w+)/)?.[1];
        if (!variant) fail(`${m[1]}: can't parse variant "${chunk}"`);
        const explicit = [...chunk.matchAll(/#\[\s*sqlx\s*\(([\s\S]*?)\)\s*\]/g)]
          .map((a) => attrString(a[1], "rename"))
          .find((r) => r !== undefined);
        return explicit ?? rename(variant);
      });

    out.set(typeName, { name: m[1], labels, where: "judge/src/models.rs" });
  }
  return out;
}

// --- Drizzle side ---

function stringLiterals(src: string): string[] {
  const noComments = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  return [...noComments.matchAll(/(["'`])((?:(?!\1)[^\\]|\\.)*)\1/g)].map((s) => s[2]);
}

function parseDrizzle(dir: string): Map<string, EnumLabels | { unresolved: string }> {
  const out = new Map<string, EnumLabels | { unresolved: string }>();
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".ts"))) {
    const src = readFileSync(join(dir, file), "utf8");
    const where = `web/drizzle/schemas/${file}`;
    const re = /(?:export\s+)?const\s+(\w+)\s*=\s*pgEnum\(\s*["'](\w+)["']\s*,\s*(\[[^\]]*\]|[A-Za-z_$][\w$]*)/g;
    for (const m of src.matchAll(re)) {
      const [, name, typeName, values] = m;
      let body = values.startsWith("[") ? values : undefined;
      // `pgEnum("x", SOME_CONST)` with the array declared in the same file.
      body ??= src.match(new RegExp(`const\\s+${values}\\s*=\\s*(\\[[^\\]]*\\])`))?.[1];
      out.set(
        typeName,
        body
          ? { name, labels: stringLiterals(body), where }
          : { unresolved: `${where}: ${name} uses ${values}, not an inline array` },
      );
    }
  }
  return out;
}

// --- compare ---

function fail(msg: string): never {
  console.error(`check-enum-sync: ${msg}`);
  process.exit(1);
}

const rust = parseRust(RUST_MODELS);
const drizzle = parseDrizzle(DRIZZLE_DIR);
const errors: string[] = [];

for (const t of REQUIRED) {
  if (!rust.has(t)) errors.push(`"${t}": no #[sqlx(type_name = "${t}")] enum found in judge/src/models.rs`);
}

for (const [typeName, r] of rust) {
  const d = drizzle.get(typeName);
  if (!d) {
    errors.push(`"${typeName}" (Rust ${r.name}): no pgEnum("${typeName}", ...) in web/drizzle/schemas`);
    continue;
  }
  if ("unresolved" in d) {
    errors.push(`"${typeName}": can't read Drizzle values (${d.unresolved})`);
    continue;
  }
  const onlyRust = r.labels.filter((l) => !d.labels.includes(l));
  const onlyTs = d.labels.filter((l) => !r.labels.includes(l));
  if (onlyRust.length || onlyTs.length) {
    errors.push(
      [
        `"${typeName}" out of sync (Rust ${r.name} in ${r.where} vs Drizzle ${d.name} in ${d.where}):`,
        onlyRust.length && `  only in Rust:    ${onlyRust.join(", ")}`,
        onlyTs.length && `  only in Drizzle: ${onlyTs.join(", ")}`,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  } else {
    console.log(`ok  ${typeName} (${r.labels.length} labels)`);
  }
}

if (errors.length) {
  for (const e of errors) console.error(`FAIL ${e}`);
  process.exit(1);
}
