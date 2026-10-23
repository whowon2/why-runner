import { zodResolver } from "@hookform/resolvers/zod";
import { type ReactNode, useMemo, useState } from "react";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { Textarea } from "@/components/ui/textarea";
import type { SurveyFormKey } from "@/drizzle/schemas/surveys";
import { useActionErrorMessage } from "@/hooks/use-action-error-message";
import { useSubmitSurveyResponse } from "@/hooks/use-surveys";
import {
  OPEN_ANSWER_MAX,
  SURVEY_DEFINITIONS,
  SUS_KEYS,
  type SurveyAnswers,
} from "@/lib/surveys/forms";
import { answersSchema } from "@/lib/surveys/schema";
import { cn } from "@/lib/utils";
import { LikertField } from "./likert-field";
import { useSurveyText } from "./use-survey-text";

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="space-y-1 border-b pb-2">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function ChoicePill({
  type,
  name,
  checked,
  onChange,
  children,
}: {
  type: "radio" | "checkbox";
  name: string;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center border px-3 py-2 text-sm transition-colors",
        "has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:ring-[3px]",
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "hover:bg-muted",
      )}
    >
      <input
        type={type}
        name={name}
        className="sr-only"
        checked={checked}
        onChange={onChange}
      />
      {children}
    </label>
  );
}

export function SurveyForm({
  form,
  entityId,
  onSubmitted,
}: {
  form: SurveyFormKey;
  /** `null` = preview: answers are validated but never sent. */
  entityId: string | null;
  onSubmitted?: () => void;
}) {
  const t = useSurveyText();
  const errorMessage = useActionErrorMessage();
  const definition = SURVEY_DEFINITIONS[form];
  const schema = useMemo(() => answersSchema(definition), [definition]);
  const [consent, setConsent] = useState(false);
  const submit = useSubmitSurveyResponse();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SurveyAnswers>({
    resolver: zodResolver(schema) as unknown as Resolver<SurveyAnswers>,
    defaultValues: {
      profile: Object.fromEntries(
        definition.profile.map((q) => [q.key, q.kind === "multi" ? [] : ""]),
      ),
      sus: {},
      items: {},
      open: Object.fromEntries(definition.open.map((q) => [q.key, ""])),
    } as unknown as SurveyAnswers,
  });

  const onValid = (answers: SurveyAnswers) => {
    if (entityId === null) {
      toast.info(t("preview.notSaved"));
      return;
    }
    submit.mutate(
      { form, entityId, consent: true, answers },
      {
        onSuccess: () => {
          toast.success(t("page.submitted"));
          onSubmitted?.();
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  };

  const fieldError = (section: keyof SurveyAnswers, key: string) =>
    !!(errors[section] as Record<string, unknown> | undefined)?.[key];

  return (
    <form
      onSubmit={handleSubmit(onValid, () => toast.error(t("page.incomplete")))}
      className="flex flex-col gap-10"
      noValidate
    >
      <Section title={t("page.consentTitle")}>
        <p className="max-w-prose text-sm leading-relaxed">
          {t("page.consentText")}
        </p>
        <div className="flex items-center gap-3">
          <Checkbox
            id="survey-consent"
            checked={consent}
            onCheckedChange={(v) => setConsent(v === true)}
          />
          <Label htmlFor="survey-consent">{t("page.consentLabel")}</Label>
        </div>
      </Section>

      <fieldset
        disabled={!consent}
        className="flex flex-col gap-10 disabled:opacity-50"
      >
        <Section title={t("page.profileTitle")}>
          {definition.profile.map((q) => {
            const label = t(`profile.${q.key}.label`);
            const invalid = fieldError("profile", q.key);
            if (q.kind === "text") {
              return (
                <div key={q.key} className="flex flex-col gap-2">
                  <Label htmlFor={`profile-${q.key}`}>{label}</Label>
                  <Input
                    id={`profile-${q.key}`}
                    maxLength={q.maxLength}
                    placeholder={t(`profile.${q.key}.placeholder`)}
                    aria-invalid={invalid}
                    {...register(`profile.${q.key}`)}
                  />
                </div>
              );
            }
            return (
              <Controller
                key={q.key}
                control={control}
                name={`profile.${q.key}`}
                render={({ field }) => {
                  const selected = Array.isArray(field.value)
                    ? field.value
                    : [field.value];
                  return (
                    <fieldset
                      className={cn(
                        "flex flex-col gap-3 border p-4",
                        invalid && "border-destructive",
                      )}
                    >
                      <legend className="sr-only">{label}</legend>
                      <p className="text-sm font-medium">{label}</p>
                      <div className="flex flex-wrap gap-2">
                        {q.options.map((option) => (
                          <ChoicePill
                            key={option}
                            type={q.kind === "multi" ? "checkbox" : "radio"}
                            name={`profile-${q.key}`}
                            checked={selected.includes(option)}
                            onChange={() => {
                              if (q.kind === "single") {
                                field.onChange(option);
                                return;
                              }
                              field.onChange(
                                selected.includes(option)
                                  ? selected.filter((o) => o !== option)
                                  : [...selected, option],
                              );
                            }}
                          >
                            {t(`profile.${q.key}.options.${option}`)}
                          </ChoicePill>
                        ))}
                      </div>
                    </fieldset>
                  );
                }}
              />
            );
          })}
        </Section>

        <Section title={t("page.susTitle")} hint={t("page.susHint")}>
          {SUS_KEYS.map((key, i) => (
            <Controller
              key={key}
              control={control}
              name={`sus.${key}`}
              render={({ field }) => (
                <LikertField
                  label={`${i + 1}. ${t(`sus.${key}`)}`}
                  allowNotApplicable={false}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={fieldError("sus", key)}
                />
              )}
            />
          ))}
        </Section>

        <Section title={t("page.itemsTitle")} hint={t("page.itemsHint")}>
          {definition.items.map((item) => (
            <Controller
              key={item.key}
              control={control}
              name={`items.${item.key}`}
              render={({ field }) => (
                <LikertField
                  label={t(`forms.${form}.items.${item.key}`)}
                  allowNotApplicable={item.optional}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={fieldError("items", item.key)}
                />
              )}
            />
          ))}
        </Section>

        <Section title={t("page.openTitle")}>
          {definition.open.map((q) => (
            <div key={q.key} className="flex flex-col gap-2">
              <Label htmlFor={`open-${q.key}`}>
                {t(`open.${q.key}`)}
                <span className="text-xs font-normal text-muted-foreground">
                  ({q.required ? t("page.required") : t("page.optional")})
                </span>
              </Label>
              <Textarea
                id={`open-${q.key}`}
                rows={4}
                maxLength={OPEN_ANSWER_MAX}
                aria-invalid={fieldError("open", q.key)}
                {...register(`open.${q.key}`)}
              />
            </div>
          ))}
        </Section>
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit" disabled={!consent || submit.isPending}>
          <LoadingSwap isLoading={submit.isPending}>
            {t("page.submit")}
          </LoadingSwap>
        </Button>
      </div>
    </form>
  );
}
