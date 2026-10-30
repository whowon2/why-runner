"use client";

import { Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminContests } from "@/hooks/use-admin";
import { Link } from "@/i18n/navigation";
import { AdminList, useAdminListState } from "./admin-list";

export function AdminContests() {
  const t = useTranslations("AdminPage");
  const state = useAdminListState();
  const { data, isPending } = useAdminContests(state.params);
  const rows = data?.data ?? [];

  const formatDate = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString() : "—";

  return (
    <AdminList
      icon={Trophy}
      title={t("Contests.title")}
      subtitle={t("Contests.subtitle")}
      searchPlaceholder={t("Contests.searchPlaceholder")}
      state={state}
      isPending={isPending}
      count={rows.length}
      total={data?.total ?? 0}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("Contests.name")}</TableHead>
            <TableHead>{t("owner")}</TableHead>
            <TableHead>{t("Contests.status")}</TableHead>
            <TableHead>{t("Contests.dates")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <Link className="hover:underline" href={`/contests/${c.slug}`}>
                  {c.name}
                </Link>
              </TableCell>
              <TableCell>
                {c.owner && (
                  <Link
                    className="hover:underline"
                    href={`/user/${c.owner.username}`}
                  >
                    {c.owner.name}
                  </Link>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={c.status === "draft" ? "outline" : "default"}>
                  {c.status === "draft"
                    ? t("Contests.draft")
                    : t("Contests.published")}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {c.startDate || c.endDate
                  ? `${formatDate(c.startDate)} → ${formatDate(c.endDate)}`
                  : t("Contests.noDates")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </AdminList>
  );
}
