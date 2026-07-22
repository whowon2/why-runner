"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TOKEN_KEYS, type ThemeTokens } from "@/lib/themes/types";
import { isValidHexColor } from "@/lib/themes/validate";
import { useThemeTokens } from "@/providers/theme-tokens-provider";

const TOKEN_LABELS: Record<(typeof TOKEN_KEYS)[number], string> = {
  background: "background",
  main: "main",
  text: "text",
  sub: "sub",
  caret: "caret",
  error: "error",
};

function isHexTokens(tokens: ThemeTokens): boolean {
  return TOKEN_KEYS.every((key) => isValidHexColor(tokens[key]));
}

export function CustomThemeForm() {
  const { activeTokens, setCustomTokens } = useThemeTokens();

  const [fields, setFields] = useState<ThemeTokens>(() =>
    isHexTokens(activeTokens)
      ? activeTokens
      : {
          background: "#111111",
          main: "#4ade80",
          text: "#eeeeee",
          sub: "#888888",
          caret: "#eeeeee",
          error: "#da3333",
        },
  );

  function handleChange(key: (typeof TOKEN_KEYS)[number], value: string) {
    const next = { ...fields, [key]: value };
    setFields(next);

    if (isValidHexColor(value)) {
      setCustomTokens(next);
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {TOKEN_KEYS.map((key) => {
        const value = fields[key];
        const valid = isValidHexColor(value);

        return (
          <div key={key} className="flex flex-col gap-1.5">
            <Label htmlFor={`theme-token-${key}`}>{TOKEN_LABELS[key]}</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label={`${TOKEN_LABELS[key]} color picker`}
                value={valid ? value : "#000000"}
                onChange={(e) => handleChange(key, e.target.value)}
                className="size-9 border cursor-pointer shrink-0 bg-transparent p-0"
              />
              <Input
                id={`theme-token-${key}`}
                value={value}
                onChange={(e) => handleChange(key, e.target.value)}
                aria-invalid={!valid}
                className="font-mono"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
