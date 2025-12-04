import { BreadCrumbs } from "@/components/breadcrumbs";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { ProblemsList } from "./_components/list";

export default async function ProblemsPage() {
  const user = await getCurrentUser({ redirectTo: "/auth/signin" });

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 p-4">
      <BreadCrumbs />
      <ProblemsList user={user} />
    </div>
  );
}
