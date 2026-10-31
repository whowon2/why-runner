import { useCallback } from "react";
import { createLocalSetting } from "@/hooks/use-local-setting";
import {
  EDITOR_DEFAULTS,
  EDITOR_FONT_SIZE_MAX,
  EDITOR_FONT_SIZE_MIN,
  LINE_NUMBERS,
  type LineNumbers,
  type PreferenceKey,
  type PreferencesPatch,
  TAB_SIZES,
  type TabSize,
} from "@/lib/preferences";
import { bindPreference, savePreference } from "@/lib/preferences-sync";

export { EDITOR_FONT_SIZE_MAX, EDITOR_FONT_SIZE_MIN } from "@/lib/preferences";

/**
 * Code editor settings, shared by every editor and live across tabs. Kept in
 * localStorage and, when signed in, saved to the account (`preferences-sync`).
 */
function createEditorSetting<
  K extends PreferenceKey,
  T extends NonNullable<PreferencesPatch[K]>,
>(
  preference: K,
  storageKey: string,
  parse: (stored: string) => T | undefined,
  fallback: T,
) {
  const useStored = createLocalSetting<T>(
    storageKey,
    (stored) => (stored === null ? undefined : parse(stored)) ?? fallback,
    String,
    fallback,
  );
  bindPreference(preference, {
    readLocal: () => (useStored.hasStored() ? useStored.get() : undefined),
    apply: (value) => useStored.set(value as T),
  });

  return function useEditorSetting() {
    const [value, setStored] = useStored();
    const setValue = useCallback(
      (next: T) => {
        setStored(next);
        savePreference({ [preference]: next });
      },
      [setStored],
    );
    return [value, setValue] as const;
  };
}

const parseBoolean = (stored: string) =>
  stored === "true" ? true : stored === "false" ? false : undefined;

function clampFontSize(size: number) {
  return Math.min(EDITOR_FONT_SIZE_MAX, Math.max(EDITOR_FONT_SIZE_MIN, size));
}

const useStoredFontSize = createEditorSetting(
  "editorFontSize",
  "whyrunner:editor-font-size",
  (stored) => {
    const size = Number(stored);
    return Number.isInteger(size) && size > 0 ? clampFontSize(size) : undefined;
  },
  EDITOR_DEFAULTS.fontSize,
);

export function useEditorFontSize() {
  const [fontSize, setStored] = useStoredFontSize();
  const setFontSize = useCallback(
    (size: number) => setStored(clampFontSize(size)),
    [setStored],
  );
  return { fontSize, setFontSize };
}

// Whether editors insert closing brackets/quotes; on unless turned off.
export const useEditorAutoClose = createEditorSetting(
  "editorAutoClose",
  "whyrunner:editor-auto-close",
  // Stored before this only as "false" or "true"; anything else is on.
  (stored) => stored !== "false",
  EDITOR_DEFAULTS.autoClose,
);

export const useEditorVim = createEditorSetting(
  "editorVim",
  "whyrunner:editor-vim",
  parseBoolean,
  EDITOR_DEFAULTS.vim,
);

export const useEditorTabSize = createEditorSetting(
  "editorTabSize",
  "whyrunner:editor-tab-size",
  (stored) => TAB_SIZES.find((size) => String(size) === stored) as TabSize,
  EDITOR_DEFAULTS.tabSize,
);

export const useEditorWordWrap = createEditorSetting(
  "editorWordWrap",
  "whyrunner:editor-word-wrap",
  parseBoolean,
  EDITOR_DEFAULTS.wordWrap,
);

export const useEditorLineNumbers = createEditorSetting(
  "editorLineNumbers",
  "whyrunner:editor-line-numbers",
  (stored) => LINE_NUMBERS.find((mode) => mode === stored) as LineNumbers,
  EDITOR_DEFAULTS.lineNumbers,
);

export const useEditorMinimap = createEditorSetting(
  "editorMinimap",
  "whyrunner:editor-minimap",
  parseBoolean,
  EDITOR_DEFAULTS.minimap,
);
