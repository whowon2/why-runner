"use client";

import {
  GraduationCap,
  HomeIcon,
  Moon,
  ScrollText,
  Search,
  Settings,
  Sun,
  Trophy,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useCommandPalette } from "@/components/command-palette/palette-context";
import { getPaletteShortcutKeys } from "@/components/command-palette/shortcut-label";
import { Button, buttonVariants } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link, usePathname } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { AvatarButton } from "./header/avatar-button";
import { LanguageSwitcher } from "./language-switcher";
import { NotificationBell } from "./notifications/notification-bell";
import { Dock, DockIcon } from "./ui/dock";

export function UserDock() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations();
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const { setOpen: setPaletteOpen } = useCommandPalette();

  const DATA = {
    navbar: [
      { href: "/", icon: HomeIcon, label: t("Dock.home") },
      { href: "/contests", icon: Trophy, label: t("Dock.contests") },
      { href: "/problems", icon: ScrollText, label: t("Dock.problems") },
      { href: "/classes", icon: GraduationCap, label: t("Dock.roadmap") },
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
    <div className="flex flex-col items-center justify-center sticky bottom-4 mb-4 select-none pointer-events-none">
      <TooltipProvider>
        <Dock
          direction="middle"
          iconMagnification={45}
          className="pointer-events-auto"
        >
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
          <DockIcon>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setPaletteOpen(true)}
                  aria-label={t("CommandPalette.open")}
                  aria-keyshortcuts="Control+K Meta+K"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "size-12 rounded-none",
                  )}
                >
                  <Search className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="flex items-center gap-2">
                <p>{t("CommandPalette.open")}</p>
                <KbdGroup>
                  {getPaletteShortcutKeys().map((key) => (
                    <Kbd key={key}>{key}</Kbd>
                  ))}
                </KbdGroup>
              </TooltipContent>
            </Tooltip>
          </DockIcon>
          <DockIcon onClick={handleChangeTheme}>
            {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
          </DockIcon>
          <DockIcon>
            <LanguageSwitcher />
          </DockIcon>
          {session ? (
            <>
              <DockIcon>
                <NotificationBell />
              </DockIcon>
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
