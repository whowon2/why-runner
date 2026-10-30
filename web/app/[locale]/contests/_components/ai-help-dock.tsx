"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AiAssistance, Submission } from "@/drizzle/schema";
import { useMediaQuery } from "@/hooks/use-media-query";

export type DockedAiHelp = {
  submission: Submission;
  maxLevel: AiAssistance | null;
};

type AiHelpDockValue = {
  docked: DockedAiHelp | null;
  /** False outside a provider and on screens too narrow for a side panel. */
  canDock: boolean;
  dock: (help: DockedAiHelp) => void;
  close: () => void;
};

const AiHelpDockContext = createContext<AiHelpDockValue>({
  docked: null,
  canDock: false,
  dock: () => {},
  close: () => {},
});

export const AI_HELP_DOCK_MIN_WIDTH = "(min-width: 1024px)";

/**
 * Lets an AI help dialog move its hints into a side panel next to the
 * editor (exercise page, contest problem tab). Page state only.
 */
export function AiHelpDockProvider({ children }: { children: ReactNode }) {
  const isWide = useMediaQuery(AI_HELP_DOCK_MIN_WIDTH);
  const [docked, setDocked] = useState<DockedAiHelp | null>(null);

  // No room for the panel any more: drop it rather than squeeze the editor.
  useEffect(() => {
    if (!isWide) setDocked(null);
  }, [isWide]);

  const value = useMemo(
    () => ({
      docked: isWide ? docked : null,
      canDock: isWide,
      dock: setDocked,
      close: () => setDocked(null),
    }),
    [docked, isWide],
  );

  return (
    <AiHelpDockContext.Provider value={value}>
      {children}
    </AiHelpDockContext.Provider>
  );
}

export function useAiHelpDock() {
  return useContext(AiHelpDockContext);
}
