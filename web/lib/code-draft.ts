/**
 * Keys and rules for editor drafts kept in `localStorage` (editor-drafts
 * spec), so code survives a locale switch, a reload or a closed tab. Keys
 * carry the user id: lab computers are shared between students.
 *
 * Pure module: no storage access, runs in `bun test`.
 */

import type { Language } from "@/drizzle/schema";
import { isStarterCode } from "@/lib/starter-code";

export type DraftTarget = {
  kind: "exercise" | "problem" | "contest";
  /** Exercise id, problem id, or `<contestId>:<problemId>`. */
  id: string;
};

export function draftKey(
  userId: string,
  target: DraftTarget,
  language: Language,
): string {
  return `whyrunner:draft:${userId}:${target.kind}:${target.id}:${language}`;
}

export function lastLanguageKey(userId: string, target: DraftTarget): string {
  return `whyrunner:draft-lang:${userId}:${target.kind}:${target.id}`;
}

/** Blank code and the untouched starter (in any locale) aren't drafts. */
export function shouldSaveDraft(code: string, language: Language): boolean {
  return code.trim() !== "" && !isStarterCode(code, language);
}
