import type { SurveyFormKey } from "@/drizzle/schemas/surveys";

/**
 * Evaluation questionnaire definitions (TCC classroom evaluation). Text
 * lives in `messages/*.json` under `Surveys` (br is authoritative); keys here
 * are permanent once responses exist — to change a form, bump `version` and
 * add new keys instead of renaming old ones.
 */

export const SUS_KEYS = [
  "sus1",
  "sus2",
  "sus3",
  "sus4",
  "sus5",
  "sus6",
  "sus7",
  "sus8",
  "sus9",
  "sus10",
] as const;

export const LIKERT_VALUES = [1, 2, 3, 4, 5] as const;
export const NOT_APPLICABLE = "na" as const;

export const OPEN_ANSWER_MAX = 2000;

export type ProfileQuestion =
  | { key: string; kind: "single"; options: readonly string[] }
  | { key: string; kind: "multi"; options: readonly string[] }
  | { key: string; kind: "text"; maxLength: number };

export type FeatureItem = {
  key: string;
  /** Optional features also offer "Não usei". */
  optional: boolean;
};

export type OpenQuestion = { key: string; required: boolean };

export type SurveyDefinition = {
  form: SurveyFormKey;
  version: number;
  entity: "contest" | "lesson";
  profile: readonly ProfileQuestion[];
  items: readonly FeatureItem[];
  open: readonly OpenQuestion[];
};

const LANGUAGES = ["c", "cpp", "java", "python", "portugol", "rust"] as const;

const PROFESSOR_PROFILE: readonly ProfileQuestion[] = [
  {
    key: "teachingYears",
    kind: "single",
    options: ["0-2", "3-5", "6-10", "10+"],
  },
  {
    key: "previousTools",
    kind: "multi",
    options: [
      "boca",
      "beecrowd",
      "runcodes",
      "moodle_vpl",
      "codeforces",
      "none",
      "other",
    ],
  },
];

const STUDENT_PROFILE: readonly ProfileQuestion[] = [
  { key: "course", kind: "text", maxLength: 120 },
  {
    key: "judgeExperience",
    kind: "single",
    options: ["never", "few", "often"],
  },
  { key: "language", kind: "single", options: LANGUAGES },
];

const OPEN: readonly OpenQuestion[] = [
  { key: "helped", required: true },
  { key: "hindered", required: true },
  { key: "comments", required: false },
];

export const SURVEY_DEFINITIONS: Record<SurveyFormKey, SurveyDefinition> = {
  contest_author: {
    form: "contest_author",
    version: 1,
    entity: "contest",
    profile: PROFESSOR_PROFILE,
    items: [
      { key: "setup", optional: false },
      { key: "problemList", optional: false },
      { key: "validation", optional: true },
      { key: "aiAuthoring", optional: true },
      { key: "aiLevel", optional: true },
      { key: "leaderboard", optional: false },
      { key: "attemptCode", optional: true },
      { key: "judgeSpeed", optional: false },
      { key: "reuse", optional: false },
    ],
    open: OPEN,
  },
  contest_participant: {
    form: "contest_participant",
    version: 1,
    entity: "contest",
    profile: STUDENT_PROFILE,
    items: [
      { key: "joinFind", optional: false },
      { key: "editor", optional: false },
      { key: "verdictSpeed", optional: false },
      { key: "judgeFeedback", optional: false },
      { key: "aiHelp", optional: true },
      { key: "leaderboard", optional: false },
      { key: "fairness", optional: false },
      { key: "reuse", optional: false },
    ],
    open: OPEN,
  },
  lesson_author: {
    form: "lesson_author",
    version: 1,
    entity: "lesson",
    profile: PROFESSOR_PROFILE,
    items: [
      { key: "classSetup", optional: false },
      { key: "listSetup", optional: false },
      { key: "answerModes", optional: true },
      { key: "constraints", optional: true },
      { key: "aiAuthoring", optional: true },
      { key: "timeSaved", optional: false },
      { key: "review", optional: false },
      { key: "reuse", optional: false },
    ],
    open: OPEN,
  },
  lesson_student: {
    form: "lesson_student",
    version: 1,
    entity: "lesson",
    profile: STUDENT_PROFILE,
    items: [
      { key: "joinFind", optional: false },
      { key: "answerMode", optional: true },
      { key: "judgeFeedback", optional: false },
      { key: "aiHints", optional: true },
      { key: "handIn", optional: false },
      { key: "confidence", optional: false },
      { key: "selfStudy", optional: false },
    ],
    open: OPEN,
  },
};

export type LikertAnswer = (typeof LIKERT_VALUES)[number];
export type ItemAnswer = LikertAnswer | typeof NOT_APPLICABLE;

export type SurveyAnswers = {
  profile: Record<string, string | string[]>;
  sus: Record<(typeof SUS_KEYS)[number], LikertAnswer>;
  items: Record<string, ItemAnswer>;
  open: Record<string, string>;
};
