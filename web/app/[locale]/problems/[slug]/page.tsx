import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getProblemBySlug } from "@/lib/actions/problems/get-problem-by-slug";
import { isAdmin } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/require-user";
import { ProblemWorkspace } from "../_components/workspace";

// Tabs of the old tabbed problem page, mapped to the workspace drawers.
const LEGACY_TAB_PANEL: Record<string, string> = {
  results: "submissions",
  statistics: "statistics",
  tests: "tests",
};

export default async function ProblemPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const user = await requireUser({ redirectTo: "/auth/signin" });
  const problem = await getProblemBySlug(slug);

  if (!problem) notFound();

  const locale = await getLocale();
  const base = `/problems/${problem.slug}`;
  const canEdit = problem.createdBy === user.id || (await isAdmin(user.id));
  // A draft's author lands on its edit form unless they asked for a tab.
  if (canEdit && (tab === "edit" || (!tab && problem.status === "draft"))) {
    redirect({ href: `${base}/edit`, locale });
  }
  if (tab && LEGACY_TAB_PANEL[tab]) {
    redirect({ href: `${base}?panel=${LEGACY_TAB_PANEL[tab]}`, locale });
  }

  return <ProblemWorkspace problem={problem} />;
}
