"use client";

import { useEffect } from "react";
import { useCommandPalette } from "./palette-context";

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA"]);

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return EDITABLE_TAGS.has(target.tagName);
}

export function useCommandPaletteShortcut() {
  const { toggle, open } = useCommandPalette();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isCombo =
        event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);
      if (!isCombo) return;
      if (!open && isEditableTarget(event.target)) return;

      event.preventDefault();
      toggle();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, toggle]);
}
