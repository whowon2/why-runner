import { BreadCrumbs } from "@/components/breadcrumbs";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { ContestDescription } from "../_components/description";
import { ContestTabs } from "../_components/tabs";

export default async function Page({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser({ redirectTo: "/auth/signin" });

  return (
    <div className="flex w-full flex-col flex-1 items-center justify-center gap-4 p-4">
      <BreadCrumbs />
      <ContestDescription contestId={id} />
      <ContestTabs user={user} id={id} />
    </div>
  );
}
