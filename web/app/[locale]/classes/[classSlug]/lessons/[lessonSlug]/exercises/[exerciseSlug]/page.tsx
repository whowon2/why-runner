import { notFound } from "next/navigation";
import { db } from "@/drizzle/db";
import { requireUser } from "@/lib/auth/require-user";
import { ExerciseWorkspace } from "../../../../../_components/exercise-workspace";

export default async function ExercisePage({
  params,
}: {
  params: Promise<{
    classSlug: string;
    lessonSlug: string;
    exerciseSlug: string;
  }>;
}) {
  await requireUser({ redirectTo: "/auth/signin" });
  const { exerciseSlug } = await params;

  const exercise = await db.query.exercise.findFirst({
    where: (e, { eq }) => eq(e.slug, exerciseSlug),
    columns: { id: true },
  });
  if (!exercise) notFound();

  return <ExerciseWorkspace exerciseId={exercise.id} />;
}
