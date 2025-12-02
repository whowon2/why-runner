import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BreadCrumbs } from "@/components/breadcrumbs";
import { auth } from "@/lib/auth";
import { ProblemsList } from "./_components/list";

export default async function ProblemsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 p-4">
      <BreadCrumbs />
      <ProblemsList session={session.session} />
    </div>
  );
}
