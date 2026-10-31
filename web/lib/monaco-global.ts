import type * as MonacoApi from "monaco-editor";

/**
 * Stands in for `monaco-editor/esm/vs/editor/editor.api` (aliased in
 * `next.config.ts`) so `monaco-vim` drives the Monaco instance
 * `@monaco-editor/react` loaded from its CDN instead of bundling a second
 * copy. Import it only after an editor mounted (`CodeEditor` sets the global).
 */
const monaco = (globalThis as unknown as { monaco: typeof MonacoApi }).monaco;

export const {
  KeyCode,
  Position,
  Range,
  Selection,
  SelectionDirection,
  editor,
} = monaco;
export default monaco;
