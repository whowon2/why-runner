import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { TrackRoadmap } from "../_components/track-roadmap";

export default async function TrackPage({
  params,
}: {
  params: Promise<{ trackId: string }>;
}) {
  await requireOnboardedUser({ redirectTo: "/auth/signin" });
  const { trackId } = await params;

  return (
    <div className="flex w-full flex-1 flex-col items-center gap-4 p-4">
      <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col gap-4 py-8">
        <TrackRoadmap trackId={trackId} />
      </div>
    </div>
  );
}
