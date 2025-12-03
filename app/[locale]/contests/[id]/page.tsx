import { getCurrentUser } from "@/lib/auth/get-current-user";
import { ContestTabs } from "../_components/tabs/tabs";

export default async function Page({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser({ redirectTo: "/auth/signin" });

  return <ContestTabs user={user} id={id} />;
}
