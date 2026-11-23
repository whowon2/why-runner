import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const BRAND_NAME = "Why Runner";

/**
 * The brand name, kept out of browser page translation (Chrome/Edge would
 * otherwise render "Why Runner" as "Por que corredor"). `notranslate` covers
 * older Google Translate widgets that ignore the `translate` attribute.
 */
export function Brand({
  children = BRAND_NAME,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <span translate="no" className={cn("notranslate", className)}>
      {children}
    </span>
  );
}

const BRAND_PATTERN = /Why ?Runner/g;

/**
 * Splits a translated string so every "Why Runner"/"WhyRunner" in it renders
 * inside `<Brand>`, leaving the surrounding text translatable. Strings without
 * the brand come back unchanged.
 */
export function withBrand(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of text.matchAll(BRAND_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) parts.push(text.slice(lastIndex, index));
    parts.push(<Brand key={key++}>{match[0]}</Brand>);
    lastIndex = index + match[0].length;
  }
  if (parts.length === 0) return text;
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return parts;
}
