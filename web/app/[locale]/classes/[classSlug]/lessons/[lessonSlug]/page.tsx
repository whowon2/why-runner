import { notFound } from "next/navigation";
import { db } from "@/drizzle/db";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { LessonRoadmap } from "../../../_components/lesson-roadmap";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ classSlug: string; lessonSlug: string }>;
}) {
  await requireOnboardedUser({ redirectTo: "/auth/signin" });
  const { lessonSlug } = await params;

  const lesson = await db.query.lesson.findFirst({
    where: (l, { eq }) => eq(l.slug, lessonSlug),
    columns: { id: true },
  });
  if (!lesson) notFound();

  return (
    <div className="flex w-full flex-1 flex-col items-center gap-4 p-4">
      <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col gap-4 py-8">
        <LessonRoadmap lessonId={lesson.id} />
      </div>
    </div>
  );
}
