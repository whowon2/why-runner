import { notFound } from "next/navigation";
import { db } from "@/drizzle/db";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { ExerciseDetail } from "../../../../../_components/exercise-detail";
import { ExerciseHeader } from "../../../../../_components/exercise-header";

export default async function ExercisePage({
  params,
}: {
  params: Promise<{ classSlug: string; lessonSlug: string; exerciseSlug: string }>;
}) {
  await requireOnboardedUser({ redirectTo: "/auth/signin" });
  const { exerciseSlug } = await params;

  const exercise = await db.query.exercise.findFirst({
    where: (e, { eq }) => eq(e.slug, exerciseSlug),
    columns: { id: true },
  });
  if (!exercise) notFound();

  return (
    <div className="flex w-full flex-col flex-1 items-center gap-4 p-4">
      <div className="flex w-full max-w-7xl flex-1 flex-col gap-6 py-8">
        <ExerciseHeader exerciseId={exercise.id} />
        <ExerciseDetail exerciseId={exercise.id} />
      </div>
    </div>
  );
}
