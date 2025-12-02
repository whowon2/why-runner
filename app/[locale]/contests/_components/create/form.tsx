"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Session } from "better-auth";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCreateContest } from "@/hooks/use-create-contest";

const formSchema = z.object({
  name: z.string().min(2).max(50),
  startDate: z.string().refine(
    (dateStr) => {
      const date = new Date(dateStr);
      return !Number.isNaN(date.getTime()) && date > new Date();
    },
    {
      message: "Start Date must be in the future",
    },
  ),
  duration: z.string(),
});

export function CreateContestForm({
  onSuccessAction,
  session,
}: {
  onSuccessAction: () => void;
  session: Session;
}) {
  const t = useTranslations("ContestsPage.createDialog");
  const { mutate: createContest, isPending } = useCreateContest();

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      name: "",
      startDate: "",
      duration: "15",
    },
    resolver: zodResolver(formSchema),
  });

  if (!session) {
    return <div>You must be logged in to create a contest</div>;
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);

    const startDate = new Date(values.startDate);
    const endDate = new Date(
      startDate.getTime() + Number(values.duration) * 60 * 1000,
    );

    createContest(
      {
        name: values.name,
        description: "",
        startDate: new Date(values.startDate),
        endDate: endDate,
        createdBy: session.userId,
      },
      {
        onError: (error) => {
          toast.error("Failed to create contest", {
            description: error.message,
          });
        },
        onSettled: () => onSuccessAction(),
        onSuccess: () => {
          toast.success("Contest Created");
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
              <FormLabel>{t("name")}</FormLabel>
              <FormControl>
                <Input placeholder="Do You Have Brio 2024" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("date")}</FormLabel>
              <FormControl>
                <Input
                  placeholder="Do You Have Brio 2024"
                  type="datetime-local"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("duration")}</FormLabel>
              <FormControl>
                <Input placeholder="15" type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button disabled={isPending} type="submit">
            {isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
