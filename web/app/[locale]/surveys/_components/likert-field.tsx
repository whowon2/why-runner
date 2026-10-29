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
      {/* One column per point: number on top, its label under it. N/A
          wraps to its own row on narrow screens. */}
      <div className="grid grid-cols-5 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
        {options.map((option) => {
          const checked = value === option;
          return (
            <label
              key={option}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1 border px-1 py-2 text-center transition-colors sm:w-24 sm:px-2",
                "has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:ring-[3px]",
                option === NOT_APPLICABLE && "col-span-5 sm:col-span-1",
                checked
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              <input
                type="radio"
                name={name}
                className="sr-only"
                checked={checked}
                onChange={() => onChange(option)}
                aria-label={t(String(option))}
              />
              {option !== NOT_APPLICABLE && (
                <span className="text-sm font-medium tabular-nums">
                  {option}
                </span>
              )}
              <span
                className={cn(
                  "text-[11px] leading-tight sm:text-xs",
                  option !== NOT_APPLICABLE &&
                    !checked &&
                    "text-muted-foreground",
                )}
              >
                {option === NOT_APPLICABLE ? t("na") : t(String(option))}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
