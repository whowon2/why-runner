import { requireUser } from "@/lib/auth/require-user";
import { JoinClassClient } from "../_components/join-class-client";

export default async function JoinClassPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  await requireUser({ redirectTo: "/auth/signin" });
  const { code } = await params;

  return <JoinClassClient code={code} />;
}
