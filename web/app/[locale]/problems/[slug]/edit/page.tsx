import { Code2, Pencil } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getProblemBySlug } from "@/lib/actions/problems/get-problem-by-slug";
import { isAdmin } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/require-user";
import { DeleteProblemButton } from "../../_components/delete-problem-button";
import { PublishProblem } from "../../_components/publish-button";
import { ProblemEditTab } from "../../_components/workspace/edit";

/** The problem's edit form, for its author or an admin (not fullscreen). */
export default async function EditProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireUser({ redirectTo: "/auth/signin" });
  const problem = await getProblemBySlug(slug);
  if (
    !problem ||
    (problem.createdBy !== user.id && !(await isAdmin(user.id)))
  ) {
    notFound();
  }
  const t = await getTranslations("Workspace.Edit");

  return (
    <div className="flex w-full flex-1 flex-col items-center gap-4 p-4">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 py-8">
        <PageHeader
          action={
            <>
              {problem.status === "draft" && (
                <>
                  <PublishProblem problem={problem} />
                  <DeleteProblemButton problem={problem} />
                </>
              )}
              <Button asChild variant="outline">
                <Link href={`/problems/${problem.slug}?tab=task`}>
                  <Code2 />
                  {t("tryIt")}
                </Link>
              </Button>
            </>
          }
          icon={Pencil}
          subtitle={t("subtitle", { title: problem.title })}
          title={t("title")}
        />
        <ProblemEditTab problemId={problem.id} />
      </div>
    </div>
  );
}
