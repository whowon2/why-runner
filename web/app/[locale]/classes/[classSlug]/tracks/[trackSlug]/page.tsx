import { notFound } from "next/navigation";
import { db } from "@/drizzle/db";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { TrackRoadmap } from "../../../_components/track-roadmap";

export default async function TrackPage({
  params,
}: {
  params: Promise<{ classSlug: string; trackSlug: string }>;
}) {
  await requireOnboardedUser({ redirectTo: "/auth/signin" });
  const { trackSlug } = await params;

  const track = await db.query.lessonTrack.findFirst({
    where: (t, { eq }) => eq(t.slug, trackSlug),
    columns: { id: true },
  });
  if (!track) notFound();

  return (
    <div className="flex w-full flex-1 flex-col items-center gap-4 p-4">
      <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col gap-4 py-8">
        <TrackRoadmap trackId={track.id} />
      </div>
    </div>
  );
}
