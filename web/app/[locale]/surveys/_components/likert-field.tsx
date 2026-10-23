import { useId } from "react";
import { LIKERT_VALUES, NOT_APPLICABLE } from "@/lib/surveys/forms";
import type { ItemAnswer } from "@/lib/surveys/forms";
import { cn } from "@/lib/utils";
import { useSurveyText } from "./use-survey-text";

/** One 1–5 agreement item, optionally with "Não usei", as a radio group. */
export function LikertField({
  label,
  allowNotApplicable,
  value,
  onChange,
  invalid,
}: {
  label: string;
  allowNotApplicable: boolean;
  value: ItemAnswer | undefined;
  onChange: (value: ItemAnswer) => void;
  invalid: boolean;
}) {
  const text = useSurveyText();
  const t = (key: string) => text(`scale.${key}`);
  const name = useId();
  const options: ItemAnswer[] = allowNotApplicable
    ? [...LIKERT_VALUES, NOT_APPLICABLE]
    : [...LIKERT_VALUES];

  return (
    <fieldset
      className={cn(
        "flex flex-col gap-3 border p-4",
        invalid && "border-destructive",
      )}
      aria-invalid={invalid}
    >
      <legend className="sr-only">{label}</legend>
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = value === option;
          return (
            <label
              key={option}
              className={cn(
                "flex cursor-pointer items-center justify-center border px-3 py-2 text-sm tabular-nums transition-colors",
                "has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:ring-[3px]",
                option === NOT_APPLICABLE ? "min-w-24" : "min-w-10",
                checked
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
              title={t(String(option))}
            >
              <input
                type="radio"
                name={name}
                className="sr-only"
                checked={checked}
                onChange={() => onChange(option)}
                aria-label={t(String(option))}
              />
              {option === NOT_APPLICABLE ? t("na") : option}
            </label>
          );
        })}
      </div>
      <div className="flex justify-between gap-4 text-xs text-muted-foreground sm:max-w-64">
        <span>1 = {t("1")}</span>
        <span className="text-right">5 = {t("5")}</span>
      </div>
    </fieldset>
  );
}
