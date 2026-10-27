"use client";

import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ProblemCompareMode } from "@/drizzle/schema";

export const COMPARE_MODES = ProblemCompareMode.enumValues;

// Portugol can't be a checker: its runner rewrites stdin and takes no args.
export const CHECKER_LANGUAGES = [
  "python",
  "c",
  "cpp",
  "java",
  "rust",
] as const;

export type CompareSettingsValues = {
  compareMode: (typeof COMPARE_MODES)[number];
  floatEpsilon: number;
  checkerLanguage: (typeof CHECKER_LANGUAGES)[number];
  checkerCode: string;
};

/**
 * "Output comparison" section of the problem edit form: how the judge
 * compares a run's output with the declared one (judge/src/compare.rs), or
 * the author's custom checker program.
 */
export function CompareSettingsFields({
  form,
}: {
  // biome-ignore lint/suspicious/noExplicitAny: shared by the edit form's wider schema
  form: UseFormReturn<any>;
}) {
  const t = useTranslations("ProblemsPage.Create.Compare");
  const mode = form.watch("compareMode") as CompareSettingsValues["compareMode"];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-semibold">{t("title")}</h3>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      <FormField
        control={form.control}
        name="compareMode"
        render={({ field }) => (
          <FormItem className="max-w-md">
            <FormLabel>{t("modeLabel")}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {COMPARE_MODES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {t(`modes.${m}.label`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>{t(`modes.${mode}.help`)}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {mode === "float" && (
        <FormField
          control={form.control}
          name="floatEpsilon"
          render={({ field }) => (
            <FormItem className="max-w-[200px]">
              <FormLabel>{t("epsilonLabel")}</FormLabel>
              <FormControl>
                <Input
                  max={1}
                  step="any"
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormDescription>{t("epsilonHelp")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {mode === "checker" && (
        <>
          <FormField
            control={form.control}
            name="checkerLanguage"
            render={({ field }) => (
              <FormItem className="max-w-[200px]">
                <FormLabel>{t("checkerLanguageLabel")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CHECKER_LANGUAGES.map((language) => (
                      <SelectItem key={language} value={language}>
                        {language}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="checkerCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("checkerCodeLabel")}</FormLabel>
                <FormControl>
                  <Textarea
                    className="min-h-[200px] font-mono text-xs"
                    placeholder={t("checkerCodePlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormDescription>{t("checkerHelp")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  );
}
