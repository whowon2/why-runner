"use client";

import type { User } from "better-auth";
import {
  ClipboardList,
  LogOut,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";

export function AvatarButton({ user }: { user: User }) {
  const t = useTranslations();
  // UI hint only (cached session): /admin checks the role on the server.
  const { data: session } = authClient.useSession();
  const isAdmin = session?.user.role === "admin";
  const initials = (user.name ?? "")
    .split(" ")
    .map((name) => name[0])
    .join("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild={true}>
        <Avatar className="cursor-pointer">
          <AvatarImage src={user.image ?? ""} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuGroup>
          <Link href={"/user"}>
            <DropdownMenuItem>
              <UserIcon />
              <span>{t("AvatarButton.profile")}</span>
            </DropdownMenuItem>
          </Link>
          <Link href={"/surveys"}>
            <DropdownMenuItem>
              <ClipboardList />
              <span>{t("Dock.surveys")}</span>
            </DropdownMenuItem>
          </Link>
          {isAdmin && (
            <Link href={"/admin"}>
              <DropdownMenuItem>
                <ShieldCheck />
                <span>{t("Dock.admin")}</span>
              </DropdownMenuItem>
            </Link>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => authClient.signOut()}>
          <LogOut />
          <span>{t("AvatarButton.logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
