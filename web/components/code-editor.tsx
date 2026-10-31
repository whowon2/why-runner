"use client";

import Editor, {
  type EditorProps,
  type Monaco,
  type OnMount,
} from "@monaco-editor/react";
import {
  AArrowDown,
  AArrowUp,
  Brackets,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  EDITOR_FONT_SIZE_MAX,
  EDITOR_FONT_SIZE_MIN,
  useEditorAutoClose,
  useEditorFontSize,
  useEditorLineNumbers,
  useEditorMinimap,
  useEditorTabSize,
  useEditorVim,
  useEditorWordWrap,
} from "@/hooks/use-editor-settings";
import { buildMonacoTheme, MONACO_THEME } from "@/lib/themes/monaco-theme";
import { cn } from "@/lib/utils";
import { useThemeTokens } from "@/providers/theme-tokens-provider";

/**
 * Monaco editor used by every solution editor (lesson exercise, problem
 * workspace, contest problem). Adds a font-size control and a fullscreen
 * toggle next to the caller's `toolbar`, and opts the whole block out of
 * browser page translation: Google Translate rewrapping the text nodes React
 * owns here crashed the editor in class (`removeChild`/`insertBefore`).
 *
 * Without `height` the editor fills the remaining height of this component,
 * so give it a height (e.g. `className="min-h-0 flex-1"`) from the parent.
 *
 * Pass `maximized`/`onMaximizedChange` to let the parent own the toggle (the
 * editor workspace shell collapses its other panels instead); the editor then
 * doesn't cover the viewport itself, only Esc still leaves.
 *
 * Colors come from the app theme (`buildMonacoTheme`): the shown preset or
 * custom theme, redefined on every preset, preview or light/dark change.
 *
 * The user's editor settings (`use-editor-settings`: tab size, word wrap,
 * line numbers, minimap, vim) override the caller's `options`. Vim mode loads
 * `monaco-vim` on demand and shows its mode/command line under the editor.
 */
export function CodeEditor({
  toolbar,
  height,
  className,
  options,
  beforeMount,
  onMount,
  maximized,
  onMaximizedChange,
  ...props
}: Omit<EditorProps, "height" | "width" | "theme" | "className"> & {
  toolbar?: ReactNode;
  height?: number | string;
  className?: string;
  maximized?: boolean;
  onMaximizedChange?: (maximized: boolean) => void;
}) {
  const t = useTranslations("CodeEditor");
  const { shown, activeMode } = useThemeTokens();
  // From beforeMount: `useMonaco()` rejects unhandled when its effect is
  // cleaned up before the loader resolves (dev StrictMode).
  const [monaco, setMonaco] = useState<Monaco | null>(null);
  const defineTheme = (m: Monaco) =>
    m.editor.defineTheme(MONACO_THEME, buildMonacoTheme(shown, activeMode));
  const { fontSize, setFontSize } = useEditorFontSize();
  const [autoClose, setAutoClose] = useEditorAutoClose();
  const autoCloseMode = autoClose ? "languageDefined" : "never";
  const [vim] = useEditorVim();
  const [tabSize] = useEditorTabSize();
  const [wordWrap] = useEditorWordWrap();
  const [lineNumbers] = useEditorLineNumbers();
  const [minimap] = useEditorMinimap();
  const [editor, setEditor] = useState<Parameters<OnMount>[0] | null>(null);
  const editorAreaRef = useRef<HTMLDivElement>(null);
  const vimStatusRef = useRef<HTMLDivElement>(null);
  const [ownFullscreen, setOwnFullscreen] = useState(false);
  const controlled = maximized !== undefined;
  const fullscreen = controlled ? maximized : ownFullscreen;
  const setFullscreenRef = useRef<(on: boolean) => void>(() => {});
  setFullscreenRef.current = controlled
    ? (on) => onMaximizedChange?.(on)
    : setOwnFullscreen;
  const setFullscreen = (on: boolean) => setFullscreenRef.current(on);

  useEffect(() => {
    if (!monaco) return;
    monaco.editor.defineTheme(
      MONACO_THEME,
      buildMonacoTheme(shown, activeMode),
    );
    monaco.editor.setTheme(MONACO_THEME);
  }, [monaco, shown, activeMode]);

  useEffect(() => {
    if (!vim || !editor || !monaco) return;
    let disposed = false;
    let vimMode: { dispose: () => void } | undefined;
    // monaco-vim reads Monaco from the global (`lib/monaco-global.ts`).
    (globalThis as { monaco?: Monaco }).monaco ??= monaco;
    import("monaco-vim").then(({ initVimMode }) => {
      if (disposed) return;
      vimMode = initVimMode(editor, vimStatusRef.current);
    });
    return () => {
      disposed = true;
      vimMode?.dispose();
    };
  }, [vim, editor, monaco]);

  useEffect(() => {
    if (!fullscreen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      // Esc that closes an open select/popover/tooltip shouldn't also leave
      // fullscreen; Radix removes the content only after this handler runs.
      if (document.querySelector("[data-radix-popper-content-wrapper]")) {
        return;
      }
      // In vim, Esc inside the editor leaves insert/visual mode instead.
      if (
        vim &&
        event.target instanceof Node &&
        editorAreaRef.current?.contains(event.target)
      ) {
        return;
      }
      setFullscreenRef.current(false);
    }

    document.addEventListener("keydown", onKeyDown);
    if (controlled) {
      return () => document.removeEventListener("keydown", onKeyDown);
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [fullscreen, controlled, vim]);

  return (
    // Only classes change when toggling fullscreen, so Monaco stays mounted
    // and keeps its code, cursor and undo history.
    <div
      className={cn(
        "notranslate flex flex-col gap-4",
        fullscreen && !controlled
          ? "fixed inset-0 z-50 bg-background p-4"
          : className,
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
                  onClick={() => setFullscreen(!fullscreen)}
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
          "flex min-h-0 flex-col border",
          ((fullscreen && !controlled) || height === undefined) && "flex-1",
        )}
        style={
          (fullscreen && !controlled) || height === undefined
            ? undefined
            : { height }
        }
        ref={editorAreaRef}
      >
        <div className="min-h-0 flex-1">
          <Editor
            {...props}
            beforeMount={(m) => {
              defineTheme(m);
              setMonaco(m);
              beforeMount?.(m);
            }}
            className="rounded-none"
            height="100%"
            onMount={(mounted, m) => {
              setEditor(mounted);
              onMount?.(mounted, m);
            }}
            options={{
              automaticLayout: true,
              ...options,
              fontSize,
              autoClosingBrackets: autoCloseMode,
              autoClosingQuotes: autoCloseMode,
              autoClosingOvertype: autoClose ? "auto" : "never",
              autoSurround: autoClose ? "languageDefined" : "never",
              tabSize,
              insertSpaces: true,
              // The user's tab size wins over the starter code's indentation.
              detectIndentation: false,
              wordWrap: wordWrap ? "on" : "off",
              lineNumbers,
              minimap: { enabled: minimap },
              // Pasted text with U+2028/U+2029 would otherwise open a native,
              // English-only confirm() (Monaco's standalone dialog service).
              unusualLineTerminators: "auto",
            }}
            theme={MONACO_THEME}
            width="100%"
          />
        </div>
        {vim && (
          <div
            aria-label={t("vimStatus")}
            aria-live="polite"
            className="h-6 shrink-0 truncate border-t px-2 font-mono text-muted-foreground text-xs leading-6"
            ref={vimStatusRef}
          />
        )}
      </div>
    </div>
  );
}
