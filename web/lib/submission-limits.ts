import { z } from "zod";
import { Language } from "@/drizzle/schema";

/** Max source length (characters) accepted by any submission action. */
export const MAX_CODE_LENGTH = 64 * 1024;

/** Max stdin (characters) for a "Run with custom input". */
export const MAX_RUN_STDIN = 64 * 1024;

export const languageSchema = z.enum(Language.enumValues);
