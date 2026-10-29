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
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useActionErrorMessage } from "@/hooks/use-action-error-message";
import { useUpdateProfile } from "@/hooks/user-update-profile";
import { ActionError } from "@/lib/action-result";
import { raFieldSchema, usernameSchema } from "@/lib/username";

const updateProfileSchema = z.object({
  username: usernameSchema,
  ra: raFieldSchema,
  bio: z.string().max(280).optional(),
  location: z.string().max(120).optional(),
  website: z.union([z.url(), z.literal("")]).optional(),
});

type ProfileFormUser = Pick<User, "id"> & {
  username?: string;
  ra?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
};

export function UpdateForm({
  user,
  onSaved: onSavedAction,
}: {
  user: ProfileFormUser;
  onSaved?: () => void;
}) {
  const t = useTranslations("UserForm");
  const form = useForm<z.infer<typeof updateProfileSchema>>({
    defaultValues: {
      username: user.username ?? "",
      ra: user.ra ?? "",
      bio: user.bio ?? "",
      location: user.location ?? "",
      website: user.website ?? "",
    },
    resolver: zodResolver(updateProfileSchema),
  });

  const { mutate: updateUser } = useUpdateProfile();
  const errorMessage = useActionErrorMessage();

  async function onSubmit(values: z.infer<typeof updateProfileSchema>) {
    updateUser(values, {
      onError(error) {
        if (error instanceof ActionError) {
          const field = error.code.startsWith("RA_") ? "ra" : "username";
          form.setError(field, { message: errorMessage(error) });
          return;
        }
        toast(t("failedUpdate"));
      },
      onSuccess() {
        toast(t("updated"));
        onSavedAction?.();
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
            <FormField
              control={form.control}
              name="ra"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("ra")}</FormLabel>
                  <FormControl>
                    {/* Text, not number: RAs keep their leading zeros. */}
                    <Input
                      inputMode="numeric"
                      maxLength={7}
                      placeholder={t("raPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t("raDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("bio")}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t("bioPlaceholder")} {...field} />
                  </FormControl>
                  <FormDescription>{t("bioDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("location")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("locationPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("website")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("websitePlaceholder")} {...field} />
                  </FormControl>
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
