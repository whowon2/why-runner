"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type CodeRunner,
  type RunProgram,
  useCodeRunner,
} from "@/components/code-run/code-run";
import type {
  AiAssistance,
  Language,
  ProblemCompareMode,
  Submission,
} from "@/drizzle/schema";
import { type ExampleRuns, useExampleRuns } from "@/hooks/use-example-runs";
import type { ParsonsLine } from "@/lib/parsons";
import type { VisibleTest } from "@/lib/judge-report";
import type { SerializedWorkspace } from "@/lib/blocks/portugol-generator";

/** What the editor area holds, in the shape each submit/run action takes. */
export type WorkspaceAnswer =
  | { mode: "code"; language: Language; code: string }
  | { mode: "blocks"; workspace: SerializedWorkspace }
  | { mode: "parsons"; lines: ParsonsLine[] };

/** What a context (practice, contest, exercise) plugs into the shell. */
export type WorkspaceSource = {
  /** Tests this viewer may see, numbered as in the problem. */
  tests: VisibleTest[];
  hiddenCount: number;
  compare: { mode: ProblemCompareMode; epsilon: number };
  /** Custom runs and example plays (gate, contest setting, not parsons). */
  runsEnabled: boolean;
  /** Why the viewer can't submit here, or null when they can. */
  lockedReason: string | null;
  /** The viewer's own submissions in this context, newest first. */
  submissions: Submission[] | undefined;
  submissionsPending: boolean;
  /** `false` hides AI help; otherwise the contest cap (null = no cap). */
  ai: false | { maxLevel: AiAssistance | null };
  submit: (answer: WorkspaceAnswer) => void;
  submitting: boolean;
  toRunProgram: (answer: WorkspaceAnswer) => RunProgram | null;
};

export type ConsoleEvent =
  | { type: "run" }
  | { type: "example"; index: number }
  /** `previousId`: the newest submission before this one was sent. */
  | { type: "submission"; previousId: string | null };

type AnswerSource = {
  /** The current answer, or null after warning (no language, empty, …). */
  getAnswer: () => WorkspaceAnswer | null;
  /** Puts a past submission's code back in the editor (code mode only). */
  load?: (language: Language, code: string) => void;
};

type WorkspaceState = {
  source: WorkspaceSource;
  runner: CodeRunner;
  examples: ExampleRuns;
  event: ConsoleEvent | null;
  setEvent: (event: ConsoleEvent | null) => void;
  /** Bumped whenever a new result should pull the console/results into view. */
  attention: number;
  registerAnswer: (source: AnswerSource | null) => void;
  /** The code editor's language, for language-specific hints. */
  language: Language | null;
  setLanguage: (language: Language | null) => void;
  /** Editor maximized: the shell hides the statement and bottom panels. */
  maximized: boolean;
  setMaximized: (maximized: boolean) => void;
  canLoad: boolean;
  load: (language: Language, code: string) => void;
  /** Shows the console's custom-input tab (stdin box + Run). */
  openCustomInput: () => void;
  runCustom: () => void;
  playExamples: (indices: number[]) => void;
  submit: () => void;
};

const WorkspaceContext = createContext<WorkspaceState | null>(null);

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace outside WorkspaceProvider");
  return value;
}

/**
 * Shared state of one editor workspace: the context's source, the editor's
 * current answer (registered by the editor pane), custom runs, example plays
 * and what the console shows. Wrap `WorkspaceShell` in it.
 */
export function WorkspaceProvider({
  source,
  children,
}: {
  source: WorkspaceSource;
  children: ReactNode;
}) {
  const runner = useCodeRunner();
  const examples = useExampleRuns();
  const [event, setEventState] = useState<ConsoleEvent | null>(null);
  const [attention, setAttention] = useState(0);
  const answerSource = useRef<AnswerSource | null>(null);
  const [canLoad, setCanLoad] = useState(false);
  const [language, setLanguage] = useState<Language | null>(null);
  const [maximized, setMaximized] = useState(false);

  const setEvent = useCallback((next: ConsoleEvent | null) => {
    setEventState(next);
    if (next) setAttention((n) => n + 1);
  }, []);

  const registerAnswer = useCallback((next: AnswerSource | null) => {
    answerSource.current = next;
    setCanLoad(!!next?.load);
  }, []);

  const value = useMemo<WorkspaceState>(() => {
    const answer = () => answerSource.current?.getAnswer() ?? null;
    return {
      source,
      runner,
      examples,
      event,
      setEvent,
      attention,
      registerAnswer,
      language,
      setLanguage,
      maximized,
      setMaximized,
      canLoad,
      load: (language, code) => answerSource.current?.load?.(language, code),
      openCustomInput: () => setEvent({ type: "run" }),
      runCustom: () => {
        const current = answer();
        if (!current) return;
        runner.run(source.toRunProgram(current));
        setEvent({ type: "run" });
      },
      playExamples: (indices) => {
        const current = answer();
        if (!current) return;
        const chosen = source.tests.filter((t) => indices.includes(t.index));
        examples.play(chosen, source.toRunProgram(current), (index) =>
          setEvent({ type: "example", index }),
        );
      },
      submit: () => {
        const current = answer();
        if (!current) return;
        setEvent({
          type: "submission",
          previousId: source.submissions?.[0]?.id ?? null,
        });
        source.submit(current);
      },
    };
  }, [
    source,
    runner,
    examples,
    event,
    setEvent,
    attention,
    registerAnswer,
    language,
    maximized,
    canLoad,
  ]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
