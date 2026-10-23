import { useTranslations } from "next-intl";

/**
 * `Surveys` translator that accepts keys built from form definitions
 * (`forms.${form}.items.${key}`, …), which next-intl's typed keys can't
 * express. Every key used this way exists in both message files.
 */
export function useSurveyText() {
  const t = useTranslations("Surveys");
  return (key: string, values?: Record<string, string | number | Date>) =>
    t(key as never, values as never);
}
