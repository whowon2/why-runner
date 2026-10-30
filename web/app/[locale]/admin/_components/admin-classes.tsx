"use client";

import { School } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminClasses } from "@/hooks/use-admin";
import { Link } from "@/i18n/navigation";
import { AdminList, useAdminListState } from "./admin-list";

export function AdminClasses() {
  const t = useTranslations("AdminPage");
  const state = useAdminListState();
  const { data, isPending } = useAdminClasses(state.params);
  const rows = data?.data ?? [];

  return (
    <AdminList
      icon={School}
      title={t("Classes.title")}
      subtitle={t("Classes.subtitle")}
      searchPlaceholder={t("Classes.searchPlaceholder")}
      state={state}
      isPending={isPending}
      count={rows.length}
      total={data?.total ?? 0}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("Classes.name")}</TableHead>
            <TableHead>{t("owner")}</TableHead>
            <TableHead className="text-right">
              {t("Classes.students")}
            </TableHead>
            <TableHead className="text-right">{t("Classes.lessons")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <Link className="hover:underline" href={`/classes/${c.slug}`}>
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
              <TableCell className="text-right">{c.studentCount}</TableCell>
              <TableCell className="text-right">{c.lessonCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </AdminList>
  );
}
