"use client";

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
import { authClient } from "@/lib/auth/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
}: {
  onSuccessAction: () => void;
}) {
  const { data: session } = authClient.useSession();
  const t = useTranslations("ContestsPage.createDialog");
  const { mutate: createContest, isPending } = useCreateContest();
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      name: "New Contest",
      startDate: new Date().toISOString(),
      duration: "15",
    },
    resolver: zodResolver(formSchema),
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!session) return;

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
        createdBy: session.user.id,
      },
      {
        onError: (error) => {
          toast.error("Failed to create contest", {
            description: error.message,
          });
        },
        onSettled: () => onSuccessAction(),
        onSuccess: (data) => {
          toast.success("Contest Created");

          queryClient.invalidateQueries({ queryKey: ["contests"] });
          router.push(`/contests/${data.id}`);
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
