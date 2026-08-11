"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Brain, Delete } from "lucide-react";
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
import type { Problem } from "@/drizzle/schema";
import { useGenerateProblemNarrative } from "@/hooks/use-generate-problem-narrative";
import { useUpdateProblem } from "@/hooks/use-update-problem";
import { useRouter } from "@/i18n/navigation";
import "katex/dist/katex.min.css";
import { Eye, Pencil } from "lucide-react";
import { ProblemReviewPanel } from "./workspace/problem-review-panel";
import { ProblemValidationPanel } from "./workspace/validation";

export function NewProblem({ problem }: { problem: Problem }) {
  const t = useTranslations("ProblemsPage.Create");
  const tDifficulty = useTranslations("Difficults");
  const queryClient = useQueryClient();

  const formSchema = z.object({
    description: z.string(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    exampleCount: z.number().int().min(1),
    inputs: z.array(z.string()),
    narrative: z.string(),
    outputs: z.array(z.string()),
    title: z.string(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      description: problem.description,
      difficulty: problem.difficulty ?? undefined,
      exampleCount: problem.exampleCount,
      inputs: problem.inputs,
      narrative: problem.narrative ?? "",
      outputs: problem.outputs,
      title: problem.title,
    },
    resolver: zodResolver(formSchema),
    shouldFocusError: false,
  });

  const inputs = useFieldArray({
    control: form.control,
    name: "inputs" as never,
  });

  const outputs = useFieldArray({
    control: form.control,
    name: "outputs" as never,
  });

  const { mutate: updateProblem, isPending } = useUpdateProblem();
  const { mutate: generateNarrative, isPending: isGeneratingNarrative } =
    useGenerateProblemNarrative();
  const router = useRouter();

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateProblem(
      {
        problemId: problem.id,
        problem: {
          title: values.title,
          difficulty: values.difficulty ?? null,
          description: values.description,
          exampleCount: Math.min(
            values.exampleCount,
            values.inputs.length || 1,
          ),
          inputs: values.inputs,
          narrative: values.narrative || null,
          outputs: values.outputs,
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
            router.replace(`/problems/${updated.slug}?tab=edit`);
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

  function addInput() {
    inputs.append("");
    outputs.append("");
  }

  function addEdgeCase(input: string, output: string) {
    inputs.append(input);
    outputs.append(output);
  }

  function handleGenerateNarrative() {
    generateNarrative(problem.id, {
      onError: (error) => {
        toast.error(t("generateNarrativeFailed"), {
          description: error.message,
        });
      },
      onSuccess: (narrative) => {
        form.setValue("narrative", narrative, { shouldDirty: true });
      },
    });
  }

  useEffect(() => {
    if (inputs.fields.length === 0) {
      inputs.append("");
    }
    if (outputs.fields.length === 0) {
      outputs.append("");
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
                name="exampleCount"
                render={({ field }) => (
                  <FormItem className="max-w-[200px]">
                    <FormLabel>{t("examplesShown")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={formValues.inputs?.length || 1}
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <div className="flex w-full flex-col gap-4">
                  {inputs.fields.map((input, index) => (
                    <div className="flex justify-between gap-4" key={input.id}>
                      <FormField
                        control={form.control}
                        name={`inputs.${index}`}
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
                    </div>
                  ))}
                </div>

                <div className="flex w-full flex-col gap-4">
                  {outputs.fields.map((input, index) => (
                    <div className="flex justify-between gap-4" key={input.id}>
                      <FormField
                        control={form.control}
                        name={`outputs.${index}`}
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
                      <Button
                        variant="ghost"
                        className="mt-7 max-w-min text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() => {
                          inputs.remove(index);
                          outputs.remove(index);
                        }}
                        type="button"
                      >
                        <Delete className="w-5 h-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                variant="secondary"
                className="max-w-min"
                onClick={addInput}
                type="button"
              >
                {t("addInputOutput")}
              </Button>

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
              <h1 className="text-3xl font-extrabold tracking-tight">
                {formValues.title || t("untitled")}
              </h1>
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
                  <ReactMarkdown>{formValues.narrative}</ReactMarkdown>
                </div>
              </div>
            )}

            <div className="prose dark:prose-invert max-w-none text-foreground prose-p:leading-relaxed prose-pre:bg-muted/50">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {formValues.description || t("noDescription")}
              </ReactMarkdown>
            </div>

            {formValues.inputs && formValues.inputs.length > 0 && (
              <div className="space-y-6 pt-6">
                <h3 className="text-xl font-bold tracking-tight">
                  {t("examplesTitle")}
                </h3>
                {formValues.inputs.map((input, idx) => (
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
                      <pre className="p-4 bg-muted/80 rounded-md overflow-x-auto text-sm font-mono text-foreground border border-border/50">
                        {input || " "}
                      </pre>
                    </div>
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                          {t("outputLabel", { n: idx + 1 })}
                        </h4>
                        <CopyButton value={formValues.outputs?.[idx] ?? ""} />
                      </div>
                      <pre className="p-4 bg-muted/80 rounded-md overflow-x-auto text-sm font-mono text-foreground border border-border/50">
                        {formValues.outputs?.[idx] || " "}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
