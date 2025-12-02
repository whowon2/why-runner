import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BreadCrumbs } from "@/components/breadcrumbs";
import { auth } from "@/lib/auth";
import { ContestList } from "./_components/list";

export default async function ContestsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="flex w-full flex-col flex-1 items-center justify-center gap-4 p-4">
      <BreadCrumbs />
      <ContestList />
    </div>
  );
}
