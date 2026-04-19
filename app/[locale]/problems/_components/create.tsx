"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "better-auth";
import { Delete } from "lucide-react";
import { useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProblem } from "@/hooks/use-create-problem";
import { useRouter } from "@/i18n/navigation";
import "katex/dist/katex.min.css";
import { Eye, Pencil } from "lucide-react";
import { ShareToFeedModal } from "@/components/share-to-feed-modal";
import { createActivity } from "@/lib/actions/activity/create-activity";

const formSchema = z.object({
  description: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"], {
    message: "Difficulty is required",
  }),
  exampleCount: z.coerce.number().int().min(1),
  inputs: z.array(z.string().min(1)).min(1),
  outputs: z.array(z.string().min(1)).min(1),
  title: z.string().min(1),
});

export function NewProblem({ user }: { user: User }) {
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      description:
        "Consider an algorithm that takes as input a positive integer n. If n is even, the algorithm divides it by two, and if n is odd, the algorithm multiplies it by three and adds one. The algorithm repeats this, until n is one. For example, the sequence for n=3 is as follows:",
      difficulty: "easy",
      exampleCount: 1,
      inputs: [],
      outputs: [],
      title: "Weird Algorithm",
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

  const router = useRouter();

  const { mutate: createProblem, isPending } = useCreateProblem();

  const [showShareModal, setShowShareModal] = useState(false);
  const [createdProblem, setCreatedProblem] = useState<any>(null);

  function onSubmit(values: z.infer<typeof formSchema>) {
    createProblem(
      {
        createdBy: user.id,
        title: values.title,
        difficulty: values.difficulty,
        description: values.description,
        exampleCount: Math.min(values.exampleCount, values.inputs.length),
        inputs: values.inputs,
        outputs: values.outputs,
      },
      {
        onError(error) {
          console.error(error);
          toast.error("An error occurred", {
            description: error.message,
          });
        },
        onSettled() {
          queryClient.invalidateQueries({ queryKey: ["problems"] });
        },
        onSuccess(data) {
          toast.success("Problem created successfully!");
          setCreatedProblem(data);
          setShowShareModal(true);
        },
      },
    );
  }

  function addInput() {
    // update error state
    form.trigger();
    // if there are no errors, add a new input and output field
    if (
      form.formState.errors.inputs === undefined &&
      form.formState.errors.outputs === undefined
    ) {
      inputs.append("");
      outputs.append("");
    }
  }

  useEffect(() => {
    if (inputs.fields.length === 0) {
      inputs.append("");
    }
    if (outputs.fields.length === 0) {
      outputs.append("");
    }
  }, [inputs, outputs]);

  useEffect(() => {
    console.log(form.formState.errors);
  }, [form.formState.errors]);

  const formValues = form.watch();

  return (
    <div className="flex flex-col p-8 w-full max-w-5xl mx-auto">
      <div className="flex justify-between mb-8">
        <h1 className="font-extrabold text-3xl tracking-tight">
          Create Problem
        </h1>
      </div>

      <Tabs defaultValue="edit" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <Pencil className="w-4 h-4" />
            Edit Problem
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Live Preview
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
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="1 2 3" {...field} />
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
                      <FormLabel>Description</FormLabel>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        Supports Markdown & LaTeX
                      </span>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Consider an algorithm that takes as input a positive integer n."
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
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem className="text-green-400" value="easy">
                          Fácil
                        </SelectItem>
                        <SelectItem className="text-orange-400" value="medium">
                          Médio
                        </SelectItem>
                        <SelectItem className="text-red-400" value="hard">
                          Difícil
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
                    <FormLabel>Examples shown to solvers</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={formValues.inputs?.length || 1}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <div className="flex w-full flex-col">
                  {inputs.fields.map((input, index) => (
                    <div className="flex justify-between gap-4" key={input.id}>
                      <FormField
                        control={form.control}
                        name={`inputs.${index}`}
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>Input {index + 1}</FormLabel>
                            <FormControl>
                              <Textarea
                                className="min-h-[100px] font-mono"
                                placeholder="1 2 3"
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

                <div className="flex w-full flex-col">
                  {outputs.fields.map((input, index) => (
                    <div className="flex justify-between gap-4" key={input.id}>
                      <FormField
                        control={form.control}
                        name={`outputs.${index}`}
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>Output {index + 1}</FormLabel>
                            <FormControl>
                              <Textarea
                                className="min-h-[100px] font-mono"
                                placeholder="1 2 3"
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
                + Adicionar Entrada / Saída
              </Button>

              <div className="border-t pt-6 flex justify-end">
                <Button disabled={isPending} type="submit" size="lg">
                  {isPending ? "Criando..." : "Criar Problema"}
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
                {formValues.title || "Untitled Problem"}
              </h1>
              <div className="shrink-0 mt-2 sm:mt-0">
                <span
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    formValues.difficulty === "easy"
                      ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                      : formValues.difficulty === "medium"
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"
                        : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                  }`}
                >
                  {formValues.difficulty || "NORMAL"}
                </span>
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none text-foreground prose-p:leading-relaxed prose-pre:bg-muted/50">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {formValues.description ||
                  "*(No description provided. Edit the problem to add instructions.)*"}
              </ReactMarkdown>
            </div>

            {formValues.inputs && formValues.inputs.length > 0 && (
              <div className="space-y-6 pt-6">
                <h3 className="text-xl font-bold tracking-tight">Examples</h3>
                {formValues.inputs.map((input, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col md:flex-row gap-6 bg-muted/30 p-6 rounded-lg border"
                  >
                    <div className="flex-1 space-y-3">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                        Input {idx + 1}
                      </h4>
                      <pre className="p-4 bg-muted/80 rounded-md overflow-x-auto text-sm font-mono text-foreground border border-border/50">
                        {input || " "}
                      </pre>
                    </div>
                    <div className="flex-1 space-y-3">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                        Output {idx + 1}
                      </h4>
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

      <ShareToFeedModal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          router.back();
        }}
        onShare={async (description) => {
          if (createdProblem) {
            await createActivity({
              type: "PROBLEM_CREATED",
              description,
              problemId: createdProblem.id,
            });
            toast.success("Shared to your activity feed!");
          }
          setShowShareModal(false);
          router.back();
        }}
        title="Share your new Problem"
        descriptionText={`Let your followers know you've created "${createdProblem?.title || "a new problem"}"!`}
      />
    </div>
  );
}
