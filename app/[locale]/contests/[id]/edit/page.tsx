import { BreadCrumbs } from "@/components/breadcrumbs";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { EditContest } from "../../_components/edit/edit";

export default async function Page({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const { id } = await params;

  const _user = await getCurrentUser({ redirectTo: "/auth/signin" });

  return (
    <div className="flex flex-col items-center justify-center">
      <BreadCrumbs />
      <EditContest contestId={id} />
    </div>
  );
}
