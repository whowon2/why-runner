/**
 * Live registry of forms with unsaved edits, read synchronously by the
 * guarded router (`@/i18n/navigation`) and the provider's DOM listeners.
 * Kept outside React so a navigation started right after a save sees the
 * current value instead of the last render's.
 */

type Listener = () => void;

const dirty = new Set<string>();
const listeners = new Set<Listener>();
let bypassDepth = 0;
let confirmHandler: ((leave: () => void) => void) | null = null;

function emit() {
  for (const listener of listeners) listener();
}

export function setDirty(id: string, isDirty: boolean) {
  const had = dirty.has(id);
  if (isDirty === had) return;
  if (isDirty) dirty.add(id);
  else dirty.delete(id);
  emit();
}

export function isDirty(id?: string) {
  return id === undefined ? dirty.size > 0 : dirty.has(id);
}

/** True when a navigation right now should ask first. */
export function shouldGuard() {
  return bypassDepth === 0 && dirty.size > 0;
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Runs `fn` (a navigation the form starts itself) without the guard. */
export function allowNavigation<T>(fn: () => T): T {
  bypassDepth += 1;
  try {
    return fn();
  } finally {
    bypassDepth -= 1;
  }
}

/** Set by the provider; it owns the confirmation dialog. */
export function setConfirmHandler(
  handler: ((leave: () => void) => void) | null,
) {
  confirmHandler = handler;
}

/**
 * Runs `navigate` now, or after the user confirms leaving when a form has
 * unsaved edits. "Leave" runs it with the guard off.
 */
export function guardNavigation(navigate: () => void) {
  if (!shouldGuard() || !confirmHandler) {
    navigate();
    return;
  }
  confirmHandler(() => allowNavigation(navigate));
}

// --- Back/Forward ---------------------------------------------------------
//
// Chrome runs window listeners in registration order (capture doesn't jump
// ahead at the target), and the app router adds its `popstate` listener in
// an effect on mount. So the guard's listener is added here, when this
// module first loads, which is before that effect: it can stop the event
// before the router swaps the page.

type PageEntry = { state: unknown; url: string };

/** The history entry the guarded page is on, captured when edits start. */
let guardedEntry: PageEntry | null = null;
let replayingPop = false;

export function setGuardedEntry(entry: PageEntry | null) {
  guardedEntry = entry;
}

function pageKey(url: string) {
  const parsed = new URL(url, window.location.href);
  return parsed.pathname + parsed.search;
}

function onPopState(event: PopStateEvent) {
  if (replayingPop) {
    replayingPop = false;
    return;
  }
  const entry = guardedEntry;
  if (!entry || !shouldGuard() || !confirmHandler) return;
  if (pageKey(window.location.href) === pageKey(entry.url)) return; // hash only
  event.stopImmediatePropagation();
  // Put the guarded page back on top of the history; the router never saw
  // the traversal. "Leave" steps back once, onto where the user was going
  // (for Back and for Forward alike, since pushState drops forward entries).
  window.history.pushState(entry.state, "", entry.url);
  confirmHandler(() => {
    replayingPop = true;
    window.history.back();
  });
}

declare global {
  interface Window {
    __unsavedChangesPop?: { handler: (event: PopStateEvent) => void };
  }
}

if (typeof window !== "undefined") {
  // One listener for the page's lifetime; a hot-reloaded module only swaps
  // the handler it calls, keeping the listener's early position.
  const slot = window.__unsavedChangesPop;
  if (slot) {
    slot.handler = onPopState;
  } else {
    const created = { handler: onPopState };
    window.__unsavedChangesPop = created;
    window.addEventListener("popstate", (event) => created.handler(event));
  }
}
