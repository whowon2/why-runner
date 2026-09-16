"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
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
import { useUpdateProfile } from "@/hooks/user-update-profile";

const updateProfileSchema = z.object({
  username: z.string(),
  bio: z.string().max(280).optional(),
  location: z.string().max(120).optional(),
  website: z.union([z.url(), z.literal("")]).optional(),
});

type ProfileFormUser = User & {
  username?: string;
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
      bio: user.bio ?? "",
      location: user.location ?? "",
      website: user.website ?? "",
    },
    resolver: zodResolver(updateProfileSchema),
  });

  const { mutate: updateUser } = useUpdateProfile();
  const queryClient = useQueryClient();

  async function onSubmit(values: z.infer<typeof updateProfileSchema>) {
    updateUser(values, {
      onError() {
        toast(t("failedUpdate"));
      },
      async onSuccess() {
        toast(t("updated"));
        queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
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
