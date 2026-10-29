import { requireUser } from "@/lib/auth/require-user";
import { ContestList } from "./_components/list";

export default async function ContestsPage() {
  await requireUser({ redirectTo: "/auth/signin" });

  return (
    <div className="flex w-full flex-col flex-1 items-center gap-4 p-4">
      <ContestList />
    </div>
  );
}
