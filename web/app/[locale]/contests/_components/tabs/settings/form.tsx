"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import type { Contest } from "@/drizzle/schema";
import { useUpdateContest } from "@/hooks/use-update-contest";
import { useRouter } from "@/i18n/navigation";

function toDateTimeLocal(date: Date | string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 16);
}

function DateTimeField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [datePart, timePart] = value ? value.split("T") : ["", ""];

  return (
    <div className="flex gap-2">
      <Input
        type="date"
        className="flex-1"
        value={datePart}
        onChange={(e) =>
          onChange(
            e.target.value ? `${e.target.value}T${timePart || "00:00"}` : "",
          )
        }
      />
      <Input
        type="time"
        className="flex-1"
        value={timePart}
        onChange={(e) =>
          onChange(datePart ? `${datePart}T${e.target.value}` : "")
        }
      />
    </div>
  );
}

function useSettingsFormSchema() {
  const t = useTranslations("ContestsPage.Tabs.Settings.Form");

  return z
    .object({
      name: z.string().min(2, t("nameMinError")).max(50),
      description: z.string().max(2000).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      isPrivate: z.boolean(),
    })
    .refine(
      (values) =>
        !values.startDate ||
        !values.endDate ||
        new Date(values.endDate) > new Date(values.startDate),
      { message: t("endDateAfterStartError"), path: ["endDate"] },
    );
}

type FormValues = z.infer<ReturnType<typeof useSettingsFormSchema>>;

export function EditContestForm({ contest }: { contest: Contest }) {
  const t = useTranslations("ContestsPage.Tabs.Settings.Form");
  const { mutate: updateContest, isPending } = useUpdateContest();
  const queryClient = useQueryClient();
  const router = useRouter();
  const formSchema = useSettingsFormSchema();

  const form = useForm<FormValues>({
    defaultValues: {
      name: contest.name,
      description: contest.description,
      startDate: toDateTimeLocal(contest.startDate),
      endDate: toDateTimeLocal(contest.endDate),
      isPrivate: contest.isPrivate,
    },
    resolver: zodResolver(formSchema),
  });

  function onSubmit(values: FormValues) {
    updateContest(
      {
        contestId: contest.id,
        contest: {
          name: values.name,
          description: values.description ?? "",
          startDate: values.startDate ? new Date(values.startDate) : null,
          endDate: values.endDate ? new Date(values.endDate) : null,
          isPrivate: values.isPrivate,
        },
      },
      {
        onError: (error) => {
          toast.error(t("failedUpdate"), { description: error.message });
        },
        onSuccess: (updated) => {
          toast.success(t("updated"));
          form.reset(values);
          queryClient.invalidateQueries({
            queryKey: ["contest", String(contest.id)],
          });
          queryClient.invalidateQueries({ queryKey: ["contests"] });
          if (updated?.slug && updated.slug !== contest.slug) {
            router.replace(`/contests/${updated.slug}?tab=settings`);
          }
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("nameLabel")}</FormLabel>
              <FormControl>
                <Input placeholder={t("namePlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("descriptionLabel")}</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("startDateLabel")}</FormLabel>
                <FormControl>
                  <DateTimeField
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("endDateLabel")}</FormLabel>
                <FormControl>
                  <DateTimeField
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isPrivate"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3 rounded-none border p-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="leading-none">
                <FormLabel className="cursor-pointer">
                  {t("privateLabel")}
                </FormLabel>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("privateDescription")}
                </p>
              </div>
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
