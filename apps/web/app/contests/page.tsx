import { ContestList } from "@/components/contests/list";
import { redirect } from "next/navigation";

export default async function ContestsPage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/contests");
  }

  return (
    <div className="">
      <ContestList />
    </div>
  );
}
