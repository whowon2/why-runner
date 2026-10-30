import { useCallback } from "react";
import { createLocalSetting } from "@/hooks/use-local-setting";

// One size for every code editor, remembered across visits and tabs.
export const EDITOR_FONT_SIZE_MIN = 10;
export const EDITOR_FONT_SIZE_MAX = 32;
export const EDITOR_FONT_SIZE_DEFAULT = 14;

function clamp(size: number) {
  return Math.min(EDITOR_FONT_SIZE_MAX, Math.max(EDITOR_FONT_SIZE_MIN, size));
}

const useStoredFontSize = createLocalSetting(
  "whyrunner:editor-font-size",
  (stored) => {
    const size = Number(stored);
    return Number.isInteger(size) && size > 0
      ? clamp(size)
      : EDITOR_FONT_SIZE_DEFAULT;
  },
  String,
  EDITOR_FONT_SIZE_DEFAULT,
);

export function useEditorFontSize() {
  const [fontSize, setStored] = useStoredFontSize();
  const setFontSize = useCallback(
    (size: number) => setStored(clamp(size)),
    [setStored],
  );
  return { fontSize, setFontSize };
}
