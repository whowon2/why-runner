"use client";

import {
  FileText,
  Globe,
  GraduationCap,
  HomeIcon,
  Link2,
  LogIn,
  LogOut,
  type LucideIcon,
  Palette,
  Plus,
  ScrollText,
  Settings,
  SunMoon,
  Trophy,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useColorMode } from "@/hooks/use-color-mode";
import { useMemo } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";
import { LEGAL_SLUGS, type LegalSlugKey } from "@/lib/legal-routes";

export type CommandGroup =
  | "navigation"
  | "create"
  | "preferences"
  | "account"
  | "legal";

export type CommandView = "theme" | "language";

export type Command = {
  id: string;
  group: CommandGroup;
  label: string;
  icon: LucideIcon;
  keywords?: string[];
} & (
  | { action: () => void; view?: never }
  // Opens a submenu instead of running and closing the palette.
  | { view: CommandView; action?: never }
);

export function useCommands(): Command[] {
  const t = useTranslations("CommandPalette");
  const tLegal = useTranslations("Footer.links");
  const router = useRouter();
  const { resolvedTheme, setColorMode } = useColorMode();
  const { data: session } = authClient.useSession();

  return useMemo(() => {
    // Same split as the dock: the main sections are always listed (they
    // redirect to sign-in), everything personal needs a session.
    const navigation: Command[] = [
      {
        id: "go-home",
        group: "navigation",
        label: t("commands.goHome"),
        icon: HomeIcon,
        // Signed-in users get their personal home, visitors the landing page.
        action: () => router.push(session ? "/home" : "/"),
      },
      {
        id: "go-problems",
        group: "navigation",
        label: t("commands.goProblems"),
        icon: ScrollText,
        action: () => router.push("/problems"),
      },
      {
        id: "go-contests",
        group: "navigation",
        label: t("commands.goContests"),
        icon: Trophy,
        action: () => router.push("/contests"),
      },
      {
        id: "go-classes",
        group: "navigation",
        label: t("commands.goClasses"),
        icon: GraduationCap,
        action: () => router.push("/classes"),
      },
    ];

    if (session) {
      navigation.push(
        {
          id: "go-profile",
          group: "navigation",
          label: t("commands.goProfile"),
          icon: UserIcon,
          action: () => router.push("/user"),
        },
        {
          id: "go-my-contests",
          group: "navigation",
          label: t("commands.goMyContests"),
          icon: Trophy,
          action: () => router.push("/user?tab=contests"),
        },
        {
          id: "go-my-problems",
          group: "navigation",
          label: t("commands.goMyProblems"),
          icon: ScrollText,
          action: () => router.push("/user?tab=problems"),
        },
        {
          id: "go-settings",
          group: "navigation",
          label: t("commands.goSettings"),
          icon: Settings,
          action: () => router.push("/settings"),
        },
      );
      // UI hint only: /admin itself checks the role on the server.
      if (session.user.role === "admin") {
        navigation.push({
          id: "go-admin",
          group: "navigation",
          label: t("commands.goAdmin"),
          icon: ShieldCheck,
          action: () => router.push("/admin"),
        });
      }
    }

    const create: Command[] = session
      ? [
          {
            id: "new-problem",
            group: "create",
            label: t("commands.newProblem"),
            icon: Plus,
            action: () => router.push("/problems/new"),
          },
          {
            id: "new-contest",
            group: "create",
            label: t("commands.newContest"),
            icon: Plus,
            action: () => router.push("/contests?createContest=true"),
          },
          {
            id: "new-class",
            group: "create",
            label: t("commands.newClass"),
            icon: Plus,
            action: () => router.push("/classes?createClass=true"),
          },
        ]
      : [];

    const preferences: Command[] = [
      {
        id: "change-theme",
        group: "preferences",
        label: t("commands.changeTheme"),
        icon: Palette,
        view: "theme",
      },
      {
        id: "toggle-mode",
        group: "preferences",
        label: t("commands.toggleMode"),
        icon: SunMoon,
        keywords: ["dark", "light"],
        action: () => setColorMode(resolvedTheme === "dark" ? "light" : "dark"),
      },
      {
        id: "change-language",
        group: "preferences",
        label: t("commands.changeLanguage"),
        icon: Globe,
        keywords: ["language", "idioma", "locale"],
        view: "language",
      },
      {
        id: "copy-link",
        group: "preferences",
        label: t("commands.copyLink"),
        icon: Link2,
        action: () => {
          navigator.clipboard
            .writeText(window.location.href)
            .then(() => toast.success(t("linkCopied")))
            .catch(() => toast.error(t("linkCopyFailed")));
        },
      },
    ];

    const account: Command[] = session
      ? [
          {
            id: "logout",
            group: "account",
            label: t("commands.logout"),
            icon: LogOut,
            action: () => authClient.signOut(),
          },
        ]
      : [
          {
            id: "sign-in",
            group: "account",
            label: t("commands.signIn"),
            icon: LogIn,
            action: () => router.push("/auth/signin"),
          },
        ];

    const legal: Command[] = (
      Object.entries(LEGAL_SLUGS) as [LegalSlugKey, string][]
    ).map(([key, href]) => ({
      id: `legal-${key}`,
      group: "legal",
      label: tLegal(key),
      icon: FileText,
      action: () => router.push(href),
    }));

    return [...navigation, ...create, ...preferences, ...account, ...legal];
  }, [t, tLegal, router, session, resolvedTheme, setColorMode]);
}
