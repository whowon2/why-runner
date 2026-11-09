"use client";

import { loader } from "@monaco-editor/react";
import { useEffect, useState } from "react";
import type { Language } from "@/drizzle/schema";
import { registerPortugol } from "@/lib/monaco-portugol";
import { buildMonacoTheme, MONACO_THEME } from "@/lib/themes/monaco-theme";
import { cn } from "@/lib/utils";
import { useThemeTokens } from "@/providers/theme-tokens-provider";

// Submission language → Monaco language id (Portugol from `monaco-portugol`).
const MONACO_LANGUAGE: Record<Language, string> = {
  c: "c",
  cpp: "cpp",
  java: "java",
  python: "python",
  portugol: "portugol",
  rust: "rust",
};

/**
 * Read-only, syntax-highlighted code (submitted answers, generated Portugol).
 * Colors come from the same Monaco grammar and app theme as `CodeEditor`
 * (`monaco.editor.colorize`), without mounting an editor per block. Shows
 * the plain text until Monaco has loaded, and keeps it if loading fails.
 * Wrapping is the caller's (`whitespace-pre` by default, override in
 * `className`).
 */
export function HighlightedCode({
  code,
  language,
  className,
}: {
  code: string;
  language?: string | null;
  className?: string;
}) {
  const { shown, activeMode } = useThemeTokens();
  const [html, setHtml] = useState<string | null>(null);
  const monacoLanguage =
    (language && MONACO_LANGUAGE[language as Language]) || "plaintext";

  useEffect(() => {
    let cancelled = false;
    loader
      .init()
      .then(async (monaco) => {
        registerPortugol(monaco);
        // `colorize` emits `mtk*` classes whose CSS the active theme injects.
        monaco.editor.defineTheme(
          MONACO_THEME,
          buildMonacoTheme(shown, activeMode),
        );
        monaco.editor.setTheme(MONACO_THEME);
        // `colorize` escapes the source, so the HTML is safe to inject.
        const out = await monaco.editor.colorize(code, monacoLanguage, {
          tabSize: 4,
        });
        if (!cancelled) setHtml(out);
      })
      .catch(() => {
        if (!cancelled) setHtml(null);
      });
    return () => {
      cancelled = true;
    };
  }, [code, monacoLanguage, shown, activeMode]);

  const preClassName = cn(
    "notranslate overflow-auto font-mono text-xs whitespace-pre",
    className,
  );

  if (html === null) {
    return (
      <pre className={preClassName} translate="no">
        {code}
      </pre>
    );
  }
  return (
    <pre
      className={preClassName}
      dangerouslySetInnerHTML={{ __html: html }}
      translate="no"
    />
  );
}
