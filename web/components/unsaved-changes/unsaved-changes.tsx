"use client";

import { useRouter as useNextRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  allowNavigation,
  isDirty,
  setConfirmHandler,
  setDirty,
  setGuardedEntry,
  shouldGuard,
  subscribe,
} from "./store";

export { allowNavigation } from "./store";

/**
 * Registers a form with the leave guard (see the `unsaved-changes-guard`
 * spec): while `dirty` is true, unloading the page shows the browser's
 * prompt and in-app navigation asks first. Removed on unmount.
 */
export function useUnsavedChanges(id: string, dirty: boolean) {
  useEffect(() => {
    setDirty(id, dirty);
  }, [id, dirty]);
  useEffect(() => () => setDirty(id, false), [id]);
}

/** Whether `id` (or, without one, any form) has unsaved edits. */
export function useHasUnsavedChanges(id?: string) {
  return useSyncExternalStore(
    subscribe,
    () => isDirty(id),
    () => false,
  );
}

/** Path + search of a URL, the part that makes it another page. */
function pageKey(url: URL) {
  return url.pathname + url.search;
}

function internalLinkTarget(event: MouseEvent): string | null {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return null;
  }
  const anchor = (event.target as Element | null)?.closest?.("a[href]");
  if (!(anchor instanceof HTMLAnchorElement)) return null;
  if (anchor.hasAttribute("download")) return null;
  const target = anchor.getAttribute("target");
  if (target && target !== "_self") return null;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  if (pageKey(url) === pageKey(new URL(window.location.href))) return null;
  return url.pathname + url.search + url.hash;
}

/**
 * Owns the guard's browser listeners and the confirmation dialog. Mounted
 * once in `Providers`, inside `NextIntlClientProvider`.
 */
export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("UnsavedChanges");
  const nextRouter = useNextRouter();
  const anyDirty = useHasUnsavedChanges();
  const [pending, setPending] = useState<(() => void) | null>(null);

  const ask = useCallback((leave: () => void) => {
    setPending(() => leave);
  }, []);

  useEffect(() => {
    setConfirmHandler(ask);
    return () => setConfirmHandler(null);
  }, [ask]);

  useEffect(() => {
    if (!anyDirty) return;

    // The entry we are on when edits start: Back/Forward re-pushes it
    // (the popstate listener lives in ./store, see there).
    setGuardedEntry({
      state: window.history.state,
      url: window.location.href,
    });

    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!shouldGuard()) return;
      event.preventDefault();
      // Older browsers need returnValue set; the text itself is ignored.
      event.returnValue = "";
    }

    function onClick(event: MouseEvent) {
      if (!shouldGuard()) return;
      const href = internalLinkTarget(event);
      if (!href) return;
      // Capture phase on document: runs before next/link's own handler.
      event.preventDefault();
      event.stopPropagation();
      ask(() => nextRouter.push(href));
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      setGuardedEntry(null);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [anyDirty, ask, nextRouter]);

  function leave() {
    const run = pending;
    setPending(null);
    if (run) allowNavigation(run);
  }

  return (
    <>
      {children}
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        open={pending !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel autoFocus>{t("stay")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={leave}
            >
              {t("leave")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** Small "Unsaved changes" label for next to a Save button. */
export function UnsavedChangesHint({ dirty }: { dirty: boolean }) {
  const t = useTranslations("UnsavedChanges");
  if (!dirty) return null;
  return (
    <span aria-live="polite" className="text-muted-foreground text-sm">
      {t("hint")}
    </span>
  );
}
