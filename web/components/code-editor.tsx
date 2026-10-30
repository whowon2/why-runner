"use client";

import Editor, { type EditorProps } from "@monaco-editor/react";
import {
  AArrowDown,
  AArrowUp,
  Brackets,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { type ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEditorAutoClose } from "@/hooks/use-editor-auto-close";
import {
  EDITOR_FONT_SIZE_MAX,
  EDITOR_FONT_SIZE_MIN,
  useEditorFontSize,
} from "@/hooks/use-editor-font-size";
import { cn } from "@/lib/utils";

/**
 * Monaco editor used by every solution editor (lesson exercise, problem
 * workspace, contest problem). Adds a font-size control and a fullscreen
 * toggle next to the caller's `toolbar`, and opts the whole block out of
 * browser page translation: Google Translate rewrapping the text nodes React
 * owns here crashed the editor in class (`removeChild`/`insertBefore`).
 *
 * Without `height` the editor fills the remaining height of this component,
 * so give it a height (e.g. `className="min-h-0 flex-1"`) from the parent.
 */
export function CodeEditor({
  toolbar,
  height,
  className,
  options,
  ...props
}: Omit<EditorProps, "height" | "width" | "theme" | "className"> & {
  toolbar?: ReactNode;
  height?: number | string;
  className?: string;
}) {
  const t = useTranslations("CodeEditor");
  const { resolvedTheme } = useTheme();
  const { fontSize, setFontSize } = useEditorFontSize();
  const [autoClose, setAutoClose] = useEditorAutoClose();
  const autoCloseMode = autoClose ? "languageDefined" : "never";
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!fullscreen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      // Esc that closes an open select/popover/tooltip shouldn't also leave
      // fullscreen; Radix removes the content only after this handler runs.
      if (document.querySelector("[data-radix-popper-content-wrapper]")) {
        return;
      }
      setFullscreen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [fullscreen]);

  return (
    // Only classes change when toggling fullscreen, so Monaco stays mounted
    // and keeps its code, cursor and undo history.
    <div
      className={cn(
        "notranslate flex flex-col gap-4",
        fullscreen ? "fixed inset-0 z-50 bg-background p-4" : className,
      )}
      translate="no"
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">{toolbar}</div>
        <TooltipProvider>
          <div className="flex shrink-0 items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label={t("autoClose")}
                  aria-pressed={autoClose}
                  className={cn(!autoClose && "text-muted-foreground")}
                  onClick={() => setAutoClose(!autoClose)}
                  size="icon"
                  variant="ghost"
                >
                  <Brackets />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {autoClose ? t("autoCloseOn") : t("autoCloseOff")}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label={t("fontSmaller")}
                  disabled={fontSize <= EDITOR_FONT_SIZE_MIN}
                  onClick={() => setFontSize(fontSize - 1)}
                  size="icon"
                  variant="ghost"
                >
                  <AArrowDown />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("fontSmaller")}</TooltipContent>
            </Tooltip>
            <span
              aria-label={t("fontSize", { size: fontSize })}
              className="w-6 text-center text-muted-foreground text-xs tabular-nums"
            >
              {fontSize}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label={t("fontLarger")}
                  disabled={fontSize >= EDITOR_FONT_SIZE_MAX}
                  onClick={() => setFontSize(fontSize + 1)}
                  size="icon"
                  variant="ghost"
                >
                  <AArrowUp />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("fontLarger")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label={
                    fullscreen ? t("exitFullscreen") : t("fullscreen")
                  }
                  aria-pressed={fullscreen}
                  onClick={() => setFullscreen((on) => !on)}
                  size="icon"
                  variant="ghost"
                >
                  {fullscreen ? <Minimize2 /> : <Maximize2 />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {fullscreen ? t("exitFullscreen") : t("fullscreen")}
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
      <div
        className={cn(
          "min-h-0",
          (fullscreen || height === undefined) && "flex-1",
        )}
        style={fullscreen || height === undefined ? undefined : { height }}
      >
        <Editor
          {...props}
          className="rounded-none"
          height="100%"
          options={{
            automaticLayout: true,
            ...options,
            fontSize,
            autoClosingBrackets: autoCloseMode,
            autoClosingQuotes: autoCloseMode,
            autoClosingOvertype: autoClose ? "auto" : "never",
            autoSurround: autoClose ? "languageDefined" : "never",
            // Pasted text with U+2028/U+2029 would otherwise open a native,
            // English-only confirm() (Monaco's standalone dialog service).
            unusualLineTerminators: "auto",
          }}
          theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
          width="100%"
        />
      </div>
    </div>
  );
}
