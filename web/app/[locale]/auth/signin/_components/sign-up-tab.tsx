"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@/components/ui/button";
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
import { LoadingSwap } from "@/components/ui/loading-swap";
import { PasswordInput } from "@/components/ui/password-input";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";
import { looksLikeRa, raFieldSchema, usernameSchema } from "@/lib/username";

const signUpSchema = z.object({
  name: z.string().min(1),
  username: usernameSchema,
  email: z.email().min(1),
  password: z.string().min(6),
  ra: raFieldSchema,
});

type SignUpForm = z.infer<typeof signUpSchema>;

// Codes thrown by the user-create hook in `lib/auth/index.ts`.
const FIELD_BY_ERROR = {
  USERNAME_INVALID: "username",
  USERNAME_TAKEN: "username",
  RA_INVALID: "ra",
  RA_TAKEN: "ra",
} as const;

type IdentityErrorCode = keyof typeof FIELD_BY_ERROR;

function isIdentityErrorCode(code: unknown): code is IdentityErrorCode {
  return typeof code === "string" && code in FIELD_BY_ERROR;
}

export function SignUpTab({ redirectTo }: { redirectTo: string }) {
  const t = useTranslations("Auth");
  const tError = useTranslations("ActionErrors");
  const router = useRouter();
  const form = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      ra: "",
    },
  });

  const { isSubmitting } = form.formState;
  const [username, ra] = form.watch(["username", "ra"]);
  // Classroom test: students typed their RA as username. Nudge, don't block.
  const showRaHint = looksLikeRa(username) && !ra;

  async function handleSignUp({ ra, ...data }: SignUpForm) {
    await authClient.signUp.email(
      {
        ...data,
        ...(ra.trim() ? { ra: ra.trim() } : {}),
        callbackURL: redirectTo,
      },
      {
        onError: (error) => {
          const code = error.error.message;
          if (isIdentityErrorCode(code)) {
            form.setError(FIELD_BY_ERROR[code], { message: tError(code) });
            return;
          }
          toast.error(error.error.message || t("failedSignUp"));
        },
        onSuccess: () => {
          router.push(redirectTo);
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSignUp)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("name")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("username")}</FormLabel>
              <FormControl>
                <Input autoComplete="username" {...field} />
              </FormControl>
              <FormDescription>
                {showRaHint ? t("raHint") : t("usernameDescription")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("email")}</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("password")}</FormLabel>
              <FormControl>
                <PasswordInput {...field} />
              </FormControl>
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
                  placeholder="0064019"
                  {...field}
                />
              </FormControl>
              <FormDescription>{t("raDescription")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          <LoadingSwap isLoading={isSubmitting}>{t("signUp")}</LoadingSwap>
        </Button>
      </form>
    </Form>
  );
}
