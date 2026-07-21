import { LessonDetail } from "../_components/lesson-detail";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;

  return (
    <div className="flex w-full flex-col flex-1 items-center gap-4 p-4">
      <div className="flex w-full max-w-6xl flex-1 flex-col gap-8 py-8">
        <LessonDetail lessonId={lessonId} />
      </div>
    </div>
  );
}
