"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCompleteOnboarding } from "@/hooks/use-complete-onboarding";
import { useRouter } from "@/i18n/navigation";
import { usernameSchema } from "@/lib/username";

const onboardingSchema = z.object({
  username: usernameSchema,
});

export function OnboardingForm() {
  const t = useTranslations("OnboardingPage");
  const router = useRouter();
  const form = useForm<z.infer<typeof onboardingSchema>>({
    defaultValues: { username: "" },
    resolver: zodResolver(onboardingSchema),
  });
  const { mutate: completeOnboarding, isPending } = useCompleteOnboarding();

  function onSubmit(values: z.infer<typeof onboardingSchema>) {
    completeOnboarding(values.username, {
      onError(error) {
        toast.error(t("failed"), { description: error.message });
      },
      onSuccess() {
        router.push("/");
        router.refresh();
      },
    });
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("usernameLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("usernamePlaceholder")} {...field} />
                  </FormControl>
                  <FormDescription>{t("usernameDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button disabled={isPending} type="submit" className="w-full">
              {isPending ? t("submitting") : t("submit")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
