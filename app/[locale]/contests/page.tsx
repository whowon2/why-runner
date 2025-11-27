import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BreadCrumbs } from "@/components/breadcrumbs";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ContestList } from "./_components/list";

export default async function ContestsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/signin");
  }

  const contests = await db.query.contest.findMany({
    with: {
      users: true,
    },
  });

  return (
    <div className="flex w-full flex-col flex-1 items-center justify-center gap-4 p-4">
      <BreadCrumbs />
      <ContestList contests={contests} />
    </div>
  );
}
