import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BreadCrumbs } from "@/components/breadcrumbs";
import { auth } from "@/lib/auth";
import { EditContest } from "../../_components/edit/edit";

export default async function Page({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <BreadCrumbs />
      <EditContest contestId={id} />
    </div>
  );
}
