"use client";

// Blockly workspace for block-mode exercises: an editable editor for
// students and a read-only viewer for history/review. Heavy (Blockly is a
// large bundle) — import it through `next/dynamic` with `ssr: false` (see
// `./index.tsx`) so it only loads on pages that actually show blocks.

import * as Blockly from "blockly/core";
import "blockly/blocks";
import * as En from "blockly/msg/en";
import * as PtBr from "blockly/msg/pt-br";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef } from "react";
import {
  type BlockLabels,
  buildToolbox,
  defineBlocks,
  registerVariablesCategory,
} from "@/lib/blocks/definitions";
import {
  START_BLOCK,
  type SerializedWorkspace,
} from "@/lib/blocks/portugol-generator";

function useBlockLabels(): BlockLabels {
  const t = useTranslations("Blocks");
  return useMemo(
    () => ({
      start: t("start"),
      declare: t("declare"),
      read: t("read"),
      write: t("write"),
      repeatWhile: t("repeatWhile"),
      countWith: t("countWith"),
      doLabel: t("doLabel"),
      types: {
        inteiro: t("types.inteiro"),
        real: t("types.real"),
        cadeia: t("types.cadeia"),
        logico: t("types.logico"),
      },
      boolTrue: t("boolTrue"),
      boolFalse: t("boolFalse"),
      and: t("and"),
      or: t("or"),
      not: t("not"),
      mod: t("mod"),
      createVariable: t("createVariable"),
      categories: {
        variables: t("categories.variables"),
        io: t("categories.io"),
        decisions: t("categories.decisions"),
        loops: t("categories.loops"),
        values: t("categories.values"),
      },
    }),
    [t],
  );
}

let darkTheme: Blockly.Theme | null = null;
function getDarkTheme() {
  darkTheme ??= Blockly.Theme.defineTheme("whyrunner-dark", {
    name: "whyrunner-dark",
    base: Blockly.Themes.Classic,
    componentStyles: {
      workspaceBackgroundColour: "#1e1e1e",
      toolboxBackgroundColour: "#262626",
      toolboxForegroundColour: "#f5f5f5",
      flyoutBackgroundColour: "#2d2d2d",
      flyoutForegroundColour: "#d4d4d4",
      flyoutOpacity: 1,
      scrollbarColour: "#797979",
      insertionMarkerColour: "#ffffff",
      cursorColour: "#d0d0d0",
    },
  });
  return darkTheme;
}

const EMPTY_WORKSPACE: SerializedWorkspace = {
  blocks: { blocks: [{ type: START_BLOCK, x: 24, y: 24 } as never] },
};

// Blockly's serialized state can contain non-plain objects, which React
// server actions refuse to serialize (they arrive server-side as undefined).
// Round-trip through JSON so every consumer gets plain data.
function saveState(workspace: Blockly.Workspace): SerializedWorkspace {
  return JSON.parse(
    JSON.stringify(Blockly.serialization.workspaces.save(workspace)),
  );
}

function loadState(
  workspace: Blockly.WorkspaceSvg,
  state: SerializedWorkspace | null | undefined,
) {
  const hasStart = state?.blocks?.blocks?.some((b) => b.type === START_BLOCK);
  Blockly.serialization.workspaces.load(
    (hasStart ? state : EMPTY_WORKSPACE) as object,
    workspace,
  );
  // The start block anchors the program: students can't delete it.
  for (const block of workspace.getBlocksByType(START_BLOCK, false)) {
    block.setDeletable(false);
  }
}

export interface BlockWorkspaceProps {
  initialState?: SerializedWorkspace | null;
  onChange?: (state: SerializedWorkspace) => void;
  readOnly?: boolean;
  className?: string;
}

export default function BlockWorkspace({
  initialState,
  onChange,
  readOnly = false,
  className,
}: BlockWorkspaceProps) {
  const container = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  // Only the first value is loaded; later prop changes don't reset the
  // student's work (the workspace is the source of truth while mounted).
  // Updated on teardown so a locale/theme re-inject keeps the program.
  const stateRef = useRef(initialState);

  const locale = useLocale();
  const labels = useBlockLabels();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!container.current) return;

    Blockly.setLocale(
      (locale === "en" ? En : PtBr) as unknown as Record<string, string>,
    );
    defineBlocks(labels);

    const workspace = Blockly.inject(container.current, {
      toolbox: readOnly ? undefined : buildToolbox(labels),
      readOnly,
      renderer: "zelos",
      theme: resolvedTheme === "dark" ? getDarkTheme() : Blockly.Themes.Classic,
      trashcan: !readOnly,
      move: { scrollbars: true, drag: true, wheel: true },
      zoom: { controls: !readOnly, wheel: false, startScale: 0.8 },
      maxInstances: { [START_BLOCK]: 1 },
    });
    if (!readOnly) registerVariablesCategory(workspace, labels);
    loadState(workspace, stateRef.current);
    if (readOnly) workspace.zoomToFit();

    const listener = (event: Blockly.Events.Abstract) => {
      if (event.isUiEvent || !onChangeRef.current) return;
      onChangeRef.current(saveState(workspace));
    };
    workspace.addChangeListener(listener);
    // Report the initial state too, so the "view code" panel isn't empty.
    onChangeRef.current?.(saveState(workspace));

    return () => {
      workspace.removeChangeListener(listener);
      stateRef.current = saveState(workspace);
      workspace.dispose();
    };
  }, [labels, locale, readOnly, resolvedTheme]);

  return <div className={className ?? "h-[480px] w-full"} ref={container} />;
}
