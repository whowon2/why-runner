"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "better-auth";
import { Delete } from "lucide-react";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { useCreateProblem } from "@/hooks/use-create-problem";
import { useRouter } from "@/i18n/navigation";

const formSchema = z.object({
  description: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"], {
    message: "Difficulty is required",
  }),
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

  function onSubmit(values: z.infer<typeof formSchema>) {
    createProblem(
      {
        createdBy: user.id,
        title: values.title,
        difficulty: values.difficulty,
        description: values.description,
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
        onSuccess() {
          toast("Problem added");
          router.back();
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

  return (
    <div className="flex flex-col p-8">
      <div className="flex justify-between">
        <h1 className="font-bold text-2xl">Criar Problem</h1>
      </div>
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
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Consider an algorithm that takes as input a positive integer n."
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
                          <Input placeholder="1 2 3" {...field} />
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
                          <Input placeholder="1 2 3" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    className="mt-7 max-w-min"
                    onClick={() => {
                      inputs.remove(index);
                      outputs.remove(index);
                    }}
                    type="button"
                  >
                    <Delete />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <Button className="max-w-min" onClick={addInput} type="button">
            Adicionar Entrada / Saída
          </Button>

          <Button disabled={isPending} type="submit">
            {isPending ? "Criando..." : "Criar"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
