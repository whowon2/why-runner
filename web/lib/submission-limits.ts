import { z } from "zod";
import { Language } from "@/drizzle/schema";

/** Max source length (characters) accepted by any submission action. */
export const MAX_CODE_LENGTH = 64 * 1024;

export const languageSchema = z.enum(Language.enumValues);
