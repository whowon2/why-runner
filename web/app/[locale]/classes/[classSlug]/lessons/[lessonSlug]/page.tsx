import { notFound } from "next/navigation";
import { db } from "@/drizzle/db";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { LessonDetail } from "../../../_components/lesson-detail";
import { LessonHeader } from "../../../_components/lesson-header";

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
    <div className="flex w-full flex-col flex-1 items-center gap-4 p-4">
      <div className="flex w-full max-w-7xl flex-1 flex-col gap-6 py-8">
        <LessonHeader lessonId={lesson.id} />
        <LessonDetail lessonId={lesson.id} />
      </div>
    </div>
  );
}
