import { createNavigation } from "next-intl/navigation";
import { useMemo } from "react";
import { guardNavigation } from "@/components/unsaved-changes/store";
import { routing } from "./routing";

// Lightweight wrappers around Next.js' navigation
// APIs that consider the routing configuration
const navigation = createNavigation(routing);

export const { Link, redirect, usePathname, getPathname } = navigation;

/**
 * The locale-aware router, with `push`/`replace`/`back`/`forward` asking
 * the unsaved-changes guard first (a dialog while a form has unsaved edits).
 */
export function useRouter() {
  const router = navigation.useRouter();
  return useMemo(
    () => ({
      ...router,
      push: (...args: Parameters<typeof router.push>) =>
        guardNavigation(() => router.push(...args)),
      replace: (...args: Parameters<typeof router.replace>) =>
        guardNavigation(() => router.replace(...args)),
      back: () => guardNavigation(() => router.back()),
      forward: () => guardNavigation(() => router.forward()),
    }),
    [router],
  );
}
