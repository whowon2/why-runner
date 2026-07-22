"use client";

import {
  GraduationCap,
  HomeIcon,
  LogOut,
  type LucideIcon,
  Plus,
  ScrollText,
  Settings,
  Trophy,
  User as UserIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";

export type CommandGroup = "navigation" | "create" | "account";

export type Command = {
  id: string;
  group: CommandGroup;
  label: string;
  icon: LucideIcon;
  action: () => void;
};

export function useCommands(): Command[] {
  const t = useTranslations("CommandPalette");
  const router = useRouter();
  const { data: session } = authClient.useSession();

  return useMemo(() => {
    const navigation: Command[] = [
      {
        id: "go-home",
        group: "navigation",
        label: t("commands.goHome"),
        icon: HomeIcon,
        action: () => router.push("/"),
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
        id: "go-roadmap",
        group: "navigation",
        label: t("commands.goRoadmap"),
        icon: GraduationCap,
        action: () => router.push("/roadmap"),
      },
      {
        id: "go-settings",
        group: "navigation",
        label: t("commands.goSettings"),
        icon: Settings,
        action: () => router.push("/settings"),
      },
      {
        id: "go-profile",
        group: "navigation",
        label: t("commands.goProfile"),
        icon: UserIcon,
        action: () => router.push("/user"),
      },
    ];

    const create: Command[] = [
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
      : [];

    return [...navigation, ...create, ...account];
  }, [t, router, session]);
}
