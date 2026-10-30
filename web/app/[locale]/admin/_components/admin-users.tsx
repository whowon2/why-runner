"use client";

import { Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActionErrorMessage } from "@/hooks/use-action-error-message";
import { useAdminUsers, useSetUserRole } from "@/hooks/use-admin";
import { Link } from "@/i18n/navigation";
import { AdminList, useAdminListState } from "./admin-list";

export function AdminUsers() {
  const t = useTranslations("AdminPage.Users");
  const state = useAdminListState();
  const { data, isPending } = useAdminUsers(state.params);
  const { mutate: setRole, isPending: isSaving } = useSetUserRole();
  const errorMessage = useActionErrorMessage();
  const rows = data?.data ?? [];

  return (
    <AdminList
      icon={Users}
      title={t("title")}
      subtitle={t("subtitle")}
      searchPlaceholder={t("searchPlaceholder")}
      state={state}
      isPending={isPending}
      count={rows.length}
      total={data?.total ?? 0}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("user")}</TableHead>
            <TableHead>{t("email")}</TableHead>
            <TableHead>{t("role")}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((u) => {
            const isSelf = u.id === data?.currentUserId;
            const isAdmin = u.role === "admin";
            return (
              <TableRow key={u.id}>
                <TableCell>
                  <Link
                    className="hover:underline"
                    href={`/user/${u.username}`}
                  >
                    {u.name}
                  </Link>{" "}
                  <span className="text-muted-foreground text-xs">
                    @{u.username}
                    {isSelf && ` (${t("you")})`}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {u.email}
                </TableCell>
                <TableCell>
                  <Badge variant={isAdmin ? "default" : "outline"}>
                    {isAdmin ? t("roleAdmin") : t("roleUser")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {!isSelf && (
                    <Button
                      disabled={isSaving}
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setRole(
                          { userId: u.id, role: isAdmin ? "user" : "admin" },
                          {
                            onSuccess: () => toast.success(t("roleUpdated")),
                            onError: (error) =>
                              toast.error(errorMessage(error)),
                          },
                        )
                      }
                    >
                      {isAdmin ? t("demote") : t("promote")}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </AdminList>
  );
}
