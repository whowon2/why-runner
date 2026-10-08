"use server";

import { GoogleGenAI } from "@google/genai";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { db } from "@/drizzle/db";
import { AI_ASSISTANCE_LEVELS, contest } from "@/drizzle/schema";
import { env } from "@/env";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { type AiHintLevel, SYSTEM_INSTRUCTION, getUserPrompt } from "../prompt";
import { GEMINI_MODEL } from "@/lib/gemini-model";

export type GetAIHelpInput = {
  submissionId: string;
  /** Requested contest hint level; ignored for non-contest submissions. */
  level: AiHintLevel;
  locale: string;
};

export async function getAIHelp({
  submissionId,
  level,
  locale,
}: GetAIHelpInput) {
  const currentUser = await getCurrentUser({});

  // Load from the DB rather than trusting a client-sent submission object.
  const found = await db.query.submission.findFirst({
    where: (s, { eq }) => eq(s.id, submissionId),
    with: { problem: { columns: { inputs: false, outputs: false } } },
  });
  if (!found || found.userId !== currentUser.id) {
    throw new Error("Submission not found.");
  }
  const { problem, ...submission } = found;

  // Contest submissions are capped by the contest's AI assistance level,
  // read now so a creator's change applies to the very next request.
  let hintLevel: AiHintLevel | undefined;
  if (submission.contestId) {
    const c = await db.query.contest.findFirst({
      where: eq(contest.id, submission.contestId),
      columns: { aiAssistance: true },
    });
    const max = AI_ASSISTANCE_LEVELS.indexOf(c?.aiAssistance ?? "off");
    const requested = AI_ASSISTANCE_LEVELS.indexOf(level);
    if (max <= 0) throw new Error("AI help is disabled for this contest.");
    if (requested <= 0 || requested > max) {
      throw new Error("This hint level is not allowed in this contest.");
    }
    hintLevel = level;
  }

  const ai = new GoogleGenAI({ apiKey: env.GEMINI_KEY });

  // Block-mode hints must use the block labels the student sees.
  let blockLabels: string[] | undefined;
  if (submission.editorMode === "blocks") {
    const t = await getTranslations({
      locale: locale === "en" ? "en" : "br",
      namespace: "Blocks",
    });
    blockLabels = [
      t("start"),
      t("declare"),
      t("read"),
      t("write"),
      `${t("repeatWhile")} %1 ${t("doLabel")} %2`,
      t("countWith"),
      `${t("doLabel")} %1 ${t("repeatWhile")} %2`,
    ];
  }

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    config: { systemInstruction: SYSTEM_INSTRUCTION },
    contents: getUserPrompt({
      problem,
      submission,
      locale,
      blockLabels,
      level: hintLevel,
    }),
  });

  return response.text;
}
