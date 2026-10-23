import { useTranslations } from "next-intl";
import { ActionError } from "@/lib/action-result";

const KNOWN_CODES = [
  "RATE_LIMITED",
  "CODE_TOO_LARGE",
  "CONTEST_NOT_STARTED",
  "CONTEST_STARTED",
  "SURVEY_NOT_ELIGIBLE",
  "SURVEY_ALREADY_ANSWERED",
  "SURVEY_INVALID",
] as const;

type KnownCode = (typeof KNOWN_CODES)[number];

function isKnownCode(code: string): code is KnownCode {
  return (KNOWN_CODES as readonly string[]).includes(code);
}

/**
 * Turns an error from a server-action hook into a user-facing, localized
 * string: known `ActionError` codes map to `ActionErrors.*`, anything else
 * falls back to the error's own message.
 */
export function useActionErrorMessage() {
  const t = useTranslations("ActionErrors");

  return (error: unknown): string => {
    if (error instanceof ActionError && isKnownCode(error.code)) {
      return t(error.code, error.params as Record<string, string | number>);
    }
    if (error instanceof Error && error.message) return error.message;
    return t("unknown");
  };
}
