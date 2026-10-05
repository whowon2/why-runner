"use server";

import { GoogleGenAI } from "@google/genai";
import { getTranslations } from "next-intl/server";
import type { ProblemPreview, Submission } from "@/drizzle/schema";
import { env } from "@/env";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { SYSTEM_INSTRUCTION, getUserPrompt } from "../prompt";

export async function getAIHelp(
  problem: ProblemPreview,
  submission: Submission,
  locale: string,
) {
  await getCurrentUser({});

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
    model: "gemini-2.5-flash",
    config: { systemInstruction: SYSTEM_INSTRUCTION },
    contents: getUserPrompt({ problem, submission, locale, blockLabels }),
  });

  return response.text;
}
