import { useTheme } from "next-themes";
import { useCallback } from "react";
import type { ColorMode } from "@/lib/preferences";
import { savePreference } from "@/lib/preferences-sync";

/**
 * Light/dark/system mode with a setter that also saves it to the account.
 * Temporary previews (command palette) call next-themes' `setTheme` directly.
 */
export function useColorMode() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const setColorMode = useCallback(
    (mode: ColorMode) => {
      setTheme(mode);
      savePreference({ colorMode: mode });
    },
    [setTheme],
  );
  return { theme, resolvedTheme, setColorMode };
}
