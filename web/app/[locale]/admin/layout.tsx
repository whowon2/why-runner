import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isAdmin } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/require-user";

/** Admins only; anyone else gets not found. Admin actions re-check on their own. */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser({ redirectTo: "/auth/signin" });
  if (!(await isAdmin(user.id))) notFound();

  return children;
}
