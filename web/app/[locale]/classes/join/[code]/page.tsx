import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { JoinClassClient } from "../_components/join-class-client";

export default async function JoinClassPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  await requireOnboardedUser({ redirectTo: "/auth/signin" });
  const { code } = await params;

  return <JoinClassClient code={code} />;
}
