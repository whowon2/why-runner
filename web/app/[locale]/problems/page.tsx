import { requireUser } from "@/lib/auth/require-user";
import { ProblemsList } from "./_components/list";

export default async function ProblemsPage() {
  await requireUser({ redirectTo: "/auth/signin" });

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 p-4">
      <ProblemsList />
    </div>
  );
}
