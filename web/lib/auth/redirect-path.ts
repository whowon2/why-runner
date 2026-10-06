import { routing } from "@/i18n/routing";

export const PATHNAME_HEADER = "x-pathname";

// Only same-origin, locale-less paths are allowed as post-auth destinations,
// so `?redirectTo=` can't be used as an open redirect.
export function safeRedirectPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.includes("\\")) return "/";
  return value;
}

export function stripLocale(path: string) {
  for (const locale of routing.locales) {
    if (path === `/${locale}`) return "/";
    if (path.startsWith(`/${locale}/`) || path.startsWith(`/${locale}?`)) {
      return path.slice(locale.length + 1);
    }
  }
  return path;
}

export function withRedirectTo(href: string, redirectTo: string | null) {
  if (!redirectTo || redirectTo === "/") return href;
  return `${href}?redirectTo=${encodeURIComponent(redirectTo)}`;
}
