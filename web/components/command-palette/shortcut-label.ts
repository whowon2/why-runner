const APPLE_PLATFORM = /mac|iphone|ipad|ipod/i;

type NavigatorWithUAData = Navigator & {
  userAgentData?: { platform?: string };
};

// Client-only: reads navigator. Call after mount to avoid hydration mismatch.
export function getPaletteShortcutKeys(): [string, string] {
  if (typeof navigator === "undefined") return ["Ctrl", "K"];
  const nav = navigator as NavigatorWithUAData;
  const platform = nav.userAgentData?.platform || nav.platform || "";
  return APPLE_PLATFORM.test(platform) ? ["⌘", "K"] : ["Ctrl", "K"];
}
