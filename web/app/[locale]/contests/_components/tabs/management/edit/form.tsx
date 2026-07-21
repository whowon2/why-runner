"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
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
import type { Contest, ProblemOnContest } from "@/drizzle/schema";
import { useUpdateContest } from "@/hooks/use-update-contest";

const formSchema = z.object({
  name: z.string().min(2).max(50),
});

export function EditContestForm({
  contest,
}: {
  contest: Contest & {
    problems: ProblemOnContest[];
  };
}) {
  const t = useTranslations("ContestsPage.Tabs.Management.EditContest");
  const tCreate = useTranslations("ContestsPage.createDialog");
  const { mutate: updateContest, isPending } = useUpdateContest();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      name: contest.name,
    },
    resolver: zodResolver(formSchema),
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);

    updateContest(
      {
        contestId: contest.id,
        contest: { ...values },
      },
      {
        onError: (error) => {
          toast.error(t("failedUpdate"), { description: error.message });
        },
        onSuccess: () => {
          toast.success(t("updated"));

          form.reset(values);

          queryClient.invalidateQueries({
            queryKey: ["contest", String(contest.id)],
          });
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("nameLabel")}</FormLabel>
              <FormControl>
                <Input placeholder={tCreate("namePlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button disabled={isPending || !form.formState.isDirty} type="submit">
          {isPending ? <Loader className="animate-spin" /> : t("save")}
        </Button>
      </form>
    </Form>
  );
}
