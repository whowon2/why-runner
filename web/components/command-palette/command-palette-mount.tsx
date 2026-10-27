"use client";

import { CommandPalette } from "./command-palette";
import { CommandPaletteProvider } from "./palette-context";
import { useCommandPaletteShortcut } from "./use-command-palette-shortcut";

function Shortcut() {
  useCommandPaletteShortcut();
  return null;
}

export function CommandPaletteMount({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CommandPaletteProvider>
      <Shortcut />
      <CommandPalette />
      {children}
    </CommandPaletteProvider>
  );
}
