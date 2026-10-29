// Our Portuguese locale code is "br" (kept for its URL prefix), which isn't a
// Portuguese language tag — next-intl's Accept-Language matching would never
// pick it for a `pt-BR` browser, and fall through to a lower-ranked `en`.
// Rewriting every `pt`/`pt-*` range to `br` (keeping its q-value) lets the
// browser's own preference order decide.
export function normalizeAcceptLanguage(header: string): string {
  return header
    .split(",")
    .map((range) => {
      const [tag, ...params] = range.trim().split(";");
      if (!/^pt(-|$)/i.test(tag.trim())) return range.trim();
      return ["br", ...params].join(";");
    })
    .filter(Boolean)
    .join(",");
}
