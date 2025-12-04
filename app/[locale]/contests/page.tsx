import { BreadCrumbs } from "@/components/breadcrumbs";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { ContestList } from "./_components/list";

export default async function ContestsPage() {
  const user = await getCurrentUser({ redirectTo: "/auth/signin" });

  return (
    <div className="flex w-full flex-col flex-1 items-center justify-center gap-4 p-4">
      <BreadCrumbs />
      <ContestList user={user} />
    </div>
  );
}
