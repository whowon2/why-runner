import { notFound } from "next/navigation";
import { db } from "@/drizzle/db";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { ExerciseSimilarity } from "../../../../../../_components/exercise-similarity";

export default async function ExerciseSimilarityPage({
  params,
}: {
  params: Promise<{
    classSlug: string;
    lessonSlug: string;
    exerciseSlug: string;
  }>;
}) {
  const user = await requireOnboardedUser({ redirectTo: "/auth/signin" });
  const { classSlug, lessonSlug, exerciseSlug } = await params;

  const exercise = await db.query.exercise.findFirst({
    where: (e, { eq }) => eq(e.slug, exerciseSlug),
    columns: { id: true },
    with: {
      lesson: { columns: { title: true, slug: true, createdBy: true } },
      problem: { columns: { title: true } },
    },
  });
  // Lesson owner only; `getExerciseSimilarity` enforces this again.
  if (
    !exercise ||
    exercise.lesson.slug !== lessonSlug ||
    exercise.lesson.createdBy !== user.id
  )
    notFound();

  return (
    <div className="flex w-full flex-1 flex-col items-center gap-4 p-4">
      <ExerciseSimilarity
        exerciseId={exercise.id}
        lessonHref={`/classes/${classSlug}/lessons/${lessonSlug}`}
        lessonTitle={exercise.lesson.title}
        problemTitle={exercise.problem.title}
      />
    </div>
  );
}
