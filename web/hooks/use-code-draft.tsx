import { useCallback, useEffect, useMemo, useRef } from "react";
import { useStarterComments } from "@/components/reset-code-button";
import { Language } from "@/drizzle/schema";
import { authClient } from "@/lib/auth/client";
import {
  type DraftTarget,
  draftKey,
  lastLanguageKey,
  shouldSaveDraft,
} from "@/lib/code-draft";
import { getStarterCode, isStarterCode } from "@/lib/starter-code";

const WRITE_DELAY_MS = 500;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the editor just doesn't persist.
  }
}

function isLanguage(value: string | null): value is Language {
  return (
    value !== null && (Language.enumValues as readonly string[]).includes(value)
  );
}

type LatestSubmission = {
  status: string;
  code: string;
  language: string | null;
} | null;

/**
 * Keeps the lesson exercise / problem editor's code in `localStorage` per
 * (user, target, language), so a locale switch (which remounts the page), a
 * reload or a closed tab doesn't lose it. Restores the last language and its
 * draft once the session is known. The draft mirrors the editor: blank code
 * or the untouched starter removes it (so a reset clears it), and an
 * accepted submission of exactly the saved code clears it too.
 */
export function useCodeDraft({
  target,
  code,
  setCode,
  language,
  setLanguage,
  latest,
}: {
  target: DraftTarget;
  code: string;
  setCode: (code: string) => void;
  language: Language | null;
  setLanguage: (language: Language) => void;
  /** Newest submission for this target, to clear the draft on `PASSED`. */
  latest?: LatestSubmission;
}) {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? null;
  const comments = useStarterComments();
  // Callers pass a fresh object each render; key everything by its content.
  const { kind, id } = target;
  const draftTarget = useMemo<DraftTarget>(() => ({ kind, id }), [kind, id]);

  // The effects below read the latest values through refs so the unmount
  // and pagehide flushes don't see a stale closure.
  const state = useRef({ userId, target: draftTarget, code, language });
  state.current = { userId, target: draftTarget, code, language };
  // The code as last written to (or cleared from) storage; flushes skip
  // when nothing changed since.
  const persisted = useRef<string | null>(null);
  const restoredFor = useRef<string | null>(null);

  const flush = useCallback(() => {
    const { userId, target, code, language } = state.current;
    if (!userId || !language || restoredFor.current === null) return;
    if (persisted.current === code) return;
    write(
      draftKey(userId, target, language),
      shouldSaveDraft(code, language) ? code : null,
    );
    write(lastLanguageKey(userId, target), language);
    persisted.current = code;
  }, []);

  // Restore once per (user, target). Code the user already edited in this
  // page wins over the stored draft.
  useEffect(() => {
    if (!userId) return;
    const key = `${userId}|${draftTarget.kind}:${draftTarget.id}`;
    if (restoredFor.current === key) return;
    restoredFor.current = key;

    const { code, language } = state.current;
    const untouched =
      code.trim() === "" || (language !== null && isStarterCode(code, language));
    const stored = read(lastLanguageKey(userId, draftTarget));
    if (!untouched || !isLanguage(stored)) {
      persisted.current = null;
      return;
    }
    const draft = read(draftKey(userId, draftTarget, stored));
    const restored = draft ?? getStarterCode(stored, comments);
    setLanguage(stored);
    setCode(restored);
    persisted.current = restored;
  }, [userId, draftTarget, comments, setCode, setLanguage]);

  // Debounced write while typing or switching language.
  useEffect(() => {
    if (!userId || !language) return;
    const timer = setTimeout(flush, WRITE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [userId, language, code, flush]);

  // Unmount (e.g. the locale switch) and closing the tab write immediately.
  useEffect(() => {
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [flush]);

  // Accepted: drop the draft when the passing code is exactly what's saved.
  // The editor keeps showing it; editing again saves a new draft.
  const passedLanguage = latest?.status === "PASSED" ? latest.language : null;
  const passedCode = latest?.code;
  useEffect(() => {
    if (!userId || !isLanguage(passedLanguage)) return;
    const key = draftKey(userId, draftTarget, passedLanguage);
    if (read(key) !== passedCode) return;
    write(key, null);
    if (state.current.code === passedCode) persisted.current = passedCode;
  }, [userId, draftTarget, passedLanguage, passedCode]);

  const draftFor = useCallback(
    (lang: Language) =>
      userId ? read(draftKey(userId, draftTarget, lang)) : null,
    [userId, draftTarget],
  );

  const clearDraft = useCallback(
    (lang: Language | null) => {
      if (!userId || !lang) return;
      write(draftKey(userId, draftTarget, lang), null);
    },
    [userId, draftTarget],
  );

  return { draftFor, clearDraft };
}
