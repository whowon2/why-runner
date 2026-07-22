"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "better-auth";
import { Save } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUpdateProfile } from "@/hooks/user-update-profile";

const updateProfileSchema = z.object({
  username: z.string(),
});

export function UpdateForm({ user }: { user: User & { username?: string } }) {
  const t = useTranslations("UserForm");
  const form = useForm<z.infer<typeof updateProfileSchema>>({
    defaultValues: {
      username: user.username ?? "",
    },
    resolver: zodResolver(updateProfileSchema),
  });

  const { mutate: updateUser } = useUpdateProfile();

  async function onSubmit(values: z.infer<typeof updateProfileSchema>) {
    updateUser(values, {
      onError() {
        toast(t("failedUpdate"));
      },
      async onSuccess() {
        toast(t("updated"));
      },
    });
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("username")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("usernamePlaceholder")} {...field} />
                  </FormControl>
                  <FormDescription>{t("usernameDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild={true}>
                  <Button
                    disabled={!form.formState.isDirty}
                    type="submit"
                    variant={"default"}
                  >
                    <Save />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("saveProfile")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
