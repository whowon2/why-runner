"use client";

import { useTranslations } from "next-intl";
import type { GeneratorError } from "@/lib/blocks/portugol-generator";

/** Read-only generated Portugol, plus the block errors that block submit. */
export function PortugolCodePanel({
  code,
  errors = [],
}: {
  code: string;
  errors?: GeneratorError[];
}) {
  const t = useTranslations("Blocks");

  // One message per error kind is enough to point the student at the problem.
  const messages = [
    ...new Set(errors.map((e) => t(`errors.${e.key}`, { name: e.name ?? "" }))),
  ];

  return (
    <div className="flex flex-col gap-2">
      {messages.length > 0 && (
        <ul className="list-disc rounded-md border border-amber-300 bg-amber-50 py-2 pr-2 pl-6 text-amber-800 text-xs dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          {messages.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}
      <span className="text-muted-foreground text-xs font-semibold">
        {t("generatedCode")}
      </span>
      <pre className="max-h-72 w-full overflow-auto whitespace-pre rounded-md border bg-muted/50 p-2 font-mono text-xs text-foreground">
        {code}
      </pre>
    </div>
  );
}
