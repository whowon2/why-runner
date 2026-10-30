"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Brain, Delete, Sparkles } from "lucide-react";
import { markdownComponents } from "@/components/markdown-components";
import { CopyButton } from "@/components/copy-button";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PROBLEM_TAGS, type Problem } from "@/drizzle/schema";
import { useActionErrorMessage } from "@/hooks/use-action-error-message";
import { useGenerateProblemNarrative } from "@/hooks/use-generate-problem-narrative";
import { useSuggestProblemTags } from "@/hooks/use-suggest-problem-tags";
import { useUpdateProblem } from "@/hooks/use-update-problem";
import { useRouter } from "@/i18n/navigation";
import "katex/dist/katex.min.css";
import { Eye, Pencil } from "lucide-react";
import { ProblemTags } from "./badge";
import {
  CHECKER_LANGUAGES,
  COMPARE_MODES,
  CompareSettingsFields,
} from "./compare-settings";
import { TagMultiSelect } from "./tag-multi-select";
import { ProblemReviewPanel } from "./workspace/problem-review-panel";
import { ProblemValidationPanel } from "./workspace/validation";

export function NewProblem({
  problem,
}: {
  problem: Problem & {
    /** Only loaded for the owner's edit view (getProblemForEdit). */
    checker?: { language: string; code: string } | null;
  };
}) {
  const t = useTranslations("ProblemsPage.Create");
  const tDifficulty = useTranslations("Difficults");
  const queryClient = useQueryClient();

  const formSchema = z
    .object({
    checkerCode: z.string(),
    checkerLanguage: z.enum(CHECKER_LANGUAGES),
    compareMode: z.enum(COMPARE_MODES),
    description: z.string(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    narrative: z.string(),
    floatEpsilon: z.number().gt(0).lte(1),
    tags: z.array(z.enum(PROBLEM_TAGS)),
    title: z.string(),
    // One object per test so input, output and the example flag move
    // together (useFieldArray can't track arrays of plain strings).
    tests: z.array(
      z.object({ input: z.string(), output: z.string(), visible: z.boolean() }),
    ),
  })
    .refine(
      (v) => v.compareMode !== "checker" || v.checkerCode.trim().length > 0,
      { message: t("Compare.checkerRequired"), path: ["checkerCode"] },
    );

  const storedCheckerLanguage = CHECKER_LANGUAGES.find(
    (language) => language === problem.checker?.language,
  );

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      checkerCode: problem.checker?.code ?? "",
      checkerLanguage: storedCheckerLanguage ?? "python",
      compareMode: problem.compareMode,
      description: problem.description,
      difficulty: problem.difficulty ?? undefined,
      floatEpsilon: problem.floatEpsilon,
      narrative: problem.narrative ?? "",
      tags: problem.tags,
      title: problem.title,
      tests: problem.inputs.map((input, i) => ({
        input,
        output: problem.outputs[i] ?? "",
        visible: problem.visible[i] === true,
      })),
    },
    resolver: zodResolver(formSchema),
    shouldFocusError: false,
  });

  const tests = useFieldArray({ control: form.control, name: "tests" });

  const { mutate: updateProblem, isPending } = useUpdateProblem();
  const { mutate: generateNarrative, isPending: isGeneratingNarrative } =
    useGenerateProblemNarrative();
  const { mutate: suggestTags, isPending: isSuggestingTags } =
    useSuggestProblemTags();
  const errorMessage = useActionErrorMessage();
  const router = useRouter();

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateProblem(
      {
        problemId: problem.id,
        problem: {
          title: values.title,
          difficulty: values.difficulty ?? null,
          description: values.description,
          inputs: values.tests.map((test) => test.input),
          visible: values.tests.map((test) => test.visible),
          narrative: values.narrative || null,
          outputs: values.tests.map((test) => test.output),
          tags: values.tags,
          compareMode: values.compareMode,
          floatEpsilon: values.floatEpsilon,
          // Leaving checker mode keeps the stored checker, so switching back
          // doesn't lose it.
          ...(values.compareMode === "checker"
            ? {
                checker: {
                  language: values.checkerLanguage,
                  code: values.checkerCode,
                },
              }
            : {}),
        },
      },
      {
        onError(error) {
          toast.error(t("errorOccurred"), {
            description: error.message,
          });
        },
        onSettled() {
          queryClient.invalidateQueries({ queryKey: ["problems"] });
          // I/O pairs may have changed; a previously-passing validation run
          // could now be stale, so refetch its state.
          queryClient.invalidateQueries({
            queryKey: ["problem-validation", problem.id],
          });
        },
        onSuccess(updated) {
          toast.success(t("createdSuccess"));
          if (updated && updated.slug !== problem.slug) {
            router.replace(`/problems/${updated.slug}/edit`);
          } else {
            // `problem` (title/description/difficulty/tests) is fetched
            // server-side once in page.tsx and passed down as a prop —
            // it won't pick up this save on its own. Refresh so
            // PublishProblem's missing-fields check reflects what was just
            // saved instead of the page's stale initial state.
            router.refresh();
          }
        },
      },
    );
  }

  // New tests, typed or AI-suggested, start hidden from students.
  function addInput() {
    tests.append({ input: "", output: "", visible: false });
  }

  function addEdgeCase(input: string, output: string) {
    tests.append({ input, output, visible: false });
  }

  function handleGenerateNarrative() {
    generateNarrative(problem.id, {
      onError: (error) => {
        toast.error(t("generateNarrativeFailed"), {
          description: errorMessage(error),
        });
      },
      onSuccess: (narrative) => {
        form.setValue("narrative", narrative, { shouldDirty: true });
      },
    });
  }

  function handleSuggestTags() {
    const { title, description } = form.getValues();
    // Checked client-side too so an empty form never costs an LLM call.
    if (!description.trim()) {
      toast.error(t("suggestTagsNeedsDescription"));
      return;
    }
    suggestTags(
      { problemId: problem.id, title, description },
      {
        onError: (error) => {
          toast.error(t("suggestTagsFailed"), {
            description: errorMessage(error),
          });
        },
        onSuccess: (tags) => {
          if (tags.length === 0) {
            toast.info(t("noTagsSuggested"));
            return;
          }
          form.setValue("tags", tags, { shouldDirty: true });
        },
      },
    );
  }

  useEffect(() => {
    if (tests.fields.length === 0) {
      tests.append({ input: "", output: "", visible: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formValues = form.watch();

  return (
    <div className="flex flex-col w-full">
      <Tabs defaultValue="edit" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <Pencil className="w-4 h-4" />
            {t("editTab")}
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            {t("previewTab")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-0">
          <Form {...form}>
            <form
              className="flex flex-col space-y-8"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>{t("titleLabel")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("titlePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <div className="flex items-center justify-between">
                      <FormLabel>{t("descriptionLabel")}</FormLabel>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        {t("markdownSupport")}
                      </span>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder={t("descriptionPlaceholder")}
                        className="min-h-[250px] font-mono text-sm leading-relaxed"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="narrative"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <div className="flex items-center justify-between">
                      <FormLabel>{t("narrativeLabel")}</FormLabel>
                      <Button
                        disabled={isGeneratingNarrative}
                        onClick={handleGenerateNarrative}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Brain className="h-4 w-4" />
                        {isGeneratingNarrative
                          ? t("generatingNarrative")
                          : t("generateNarrativeWithAi")}
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder={t("narrativePlaceholder")}
                        className="min-h-[150px] font-mono text-sm leading-relaxed"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("difficultyLabel")}</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("difficultyPlaceholder")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem className="text-green-400" value="easy">
                          {tDifficulty("easy")}
                        </SelectItem>
                        <SelectItem className="text-orange-400" value="medium">
                          {tDifficulty("medium")}
                        </SelectItem>
                        <SelectItem className="text-red-400" value="hard">
                          {tDifficulty("hard")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <div className="flex items-center justify-between">
                      <FormLabel>{t("tagsLabel")}</FormLabel>
                      <Button
                        disabled={isSuggestingTags}
                        onClick={handleSuggestTags}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Sparkles className="h-4 w-4" />
                        {isSuggestingTags
                          ? t("suggestingTags")
                          : t("suggestTagsWithAi")}
                      </Button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <FormControl>
                        <TagMultiSelect
                          className="w-full sm:w-[260px]"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <ProblemTags tags={field.value} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-4">
                {tests.fields.map((test, index) => (
                  <div
                    className="flex flex-col gap-4 md:flex-row"
                    key={test.id}
                  >
                    <FormField
                      control={form.control}
                      name={`tests.${index}.input`}
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>
                            {t("inputLabel", { n: index + 1 })}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              className="min-h-[100px] font-mono"
                              placeholder={t("inputOutputPlaceholder")}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`tests.${index}.output`}
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>
                            {t("outputLabel", { n: index + 1 })}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              className="min-h-[100px] font-mono"
                              placeholder={t("inputOutputPlaceholder")}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center justify-between gap-2 md:mt-7 md:flex-col md:items-end md:justify-start">
                      <FormField
                        control={form.control}
                        name={`tests.${index}.visible`}
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) =>
                                  field.onChange(checked === true)
                                }
                              />
                            </FormControl>
                            <FormLabel className="whitespace-nowrap font-normal">
                              {t("exampleCheckbox")}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <Button
                        variant="ghost"
                        className="max-w-min text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() => tests.remove(index)}
                        type="button"
                      >
                        <Delete className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {tests.fields.length > 0 &&
                !formValues.tests?.some((test) => test.visible) && (
                  <p className="text-muted-foreground text-sm">
                    {t("noExamplesHint")}
                  </p>
                )}
              <Button
                variant="secondary"
                className="max-w-min"
                onClick={addInput}
                type="button"
              >
                {t("addInputOutput")}
              </Button>

              <Separator />

              <CompareSettingsFields form={form} />

              <Separator />

              <ProblemReviewPanel
                onAddEdgeCaseAction={addEdgeCase}
                problemId={problem.id}
              />

              <Separator />

              <ProblemValidationPanel problemId={problem.id} />

              <Separator />
              <div className="pt-6 flex justify-end">
                <Button disabled={isPending} type="submit" size="lg">
                  {isPending ? t("creating") : t("submit")}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        {/* Live Preview Tab */}
        <TabsContent value="preview" className="mt-0">
          <div className="border rounded-xl p-8 bg-card shadow-sm space-y-8 min-h-[500px]">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b pb-6">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight">
                  {formValues.title || t("untitled")}
                </h1>
                <ProblemTags tags={formValues.tags ?? []} />
              </div>
              <div className="shrink-0 mt-2 sm:mt-0">
                <span
                  className={`px-4 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider ${
                    formValues.difficulty === "easy"
                      ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                      : formValues.difficulty === "medium"
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"
                        : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                  }`}
                >
                  {formValues.difficulty
                    ? tDifficulty(formValues.difficulty)
                    : t("normal")}
                </span>
              </div>
            </div>

            {formValues.narrative && (
              <div className="border-l-2 border-muted-foreground/30 pl-4 italic text-muted-foreground">
                <span className="not-italic text-[10px] font-semibold uppercase tracking-wider">
                  {t("narrativeLabel")}
                </span>
                <div className="prose dark:prose-invert prose-sm max-w-none mt-1">
                  <ReactMarkdown components={markdownComponents}>{formValues.narrative}</ReactMarkdown>
                </div>
              </div>
            )}

            <div className="prose dark:prose-invert max-w-none text-foreground prose-p:leading-relaxed prose-pre:bg-muted/50">
              <ReactMarkdown components={markdownComponents}
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {formValues.description || t("noDescription")}
              </ReactMarkdown>
            </div>

            {formValues.tests?.some((test) => test.visible) && (
              <div className="space-y-6 pt-6">
                <h3 className="text-xl font-bold tracking-tight">
                  {t("examplesTitle")}
                </h3>
                {formValues.tests?.map(({ input, output, visible }, idx) =>
                  !visible ? null : (
                  <div
                    key={idx}
                    className="flex flex-col md:flex-row gap-6 bg-muted/30 p-6 rounded-lg border"
                  >
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                          {t("inputLabel", { n: idx + 1 })}
                        </h4>
                        <CopyButton value={input} />
                      </div>
                      <pre translate="no" className="notranslate p-4 bg-muted/80 rounded-md overflow-x-auto text-sm font-mono text-foreground border border-border/50">
                        {input || " "}
                      </pre>
                    </div>
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                          {t("outputLabel", { n: idx + 1 })}
                        </h4>
                        <CopyButton value={output} />
                      </div>
                      <pre translate="no" className="notranslate p-4 bg-muted/80 rounded-md overflow-x-auto text-sm font-mono text-foreground border border-border/50">
                        {output || " "}
                      </pre>
                    </div>
                  </div>
                  ),
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
