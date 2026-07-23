"use client";

import {
  GraduationCap,
  HomeIcon,
  Moon,
  ScrollText,
  Settings,
  Sun,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePathname } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { AvatarButton } from "./header/avatar-button";
import { Dock, DockIcon } from "./ui/dock";

export function UserDock() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations();
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  const DATA = {
    navbar: [
      { href: "/", icon: HomeIcon, label: t("Dock.home") },
      { href: "/contests", icon: Trophy, label: t("Dock.contests") },
      { href: "/problems", icon: ScrollText, label: t("Dock.problems") },
      { href: "/roadmap", icon: GraduationCap, label: t("Dock.roadmap") },
    ],
  };

  function handleChangeTheme() {
    if (!theme) return;

    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center justify-center sticky bottom-4 mb-4 select-none">
      <TooltipProvider>
        <Dock direction="middle" iconMagnification={45}>
          {DATA.navbar.map((item) => (
            <DockIcon key={item.label}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "size-12 rounded-none",
                      {
                        "text-primary": pathname === item.href,
                      },
                    )}
                  >
                    <item.icon className="size-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            </DockIcon>
          ))}
          <Separator orientation="vertical" className="h-full py-2" />
          <DockIcon onClick={handleChangeTheme}>
            {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
          </DockIcon>
          {session ? (
            <>
              <DockIcon>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/settings"
                      aria-label={t("Dock.settings")}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon" }),
                        "size-12 rounded-none",
                        {
                          "text-primary": pathname === "/settings",
                        },
                      )}
                    >
                      <Settings className="size-4" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("Dock.settings")}</p>
                  </TooltipContent>
                </Tooltip>
              </DockIcon>
              <DockIcon>
                <AvatarButton user={session.user} />
              </DockIcon>
            </>
          ) : (
            <Link href={"/auth/signin"}>
              <Button variant={"outline"}>{t("Dock.login")}</Button>
            </Link>
          )}
        </Dock>
      </TooltipProvider>
    </div>
  );
}
