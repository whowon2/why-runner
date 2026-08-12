import { notFound } from "next/navigation";
import { db } from "@/drizzle/db";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { ClassDetail } from "../_components/class-detail";

export default async function ClassPage({
  params,
}: {
  params: Promise<{ classSlug: string }>;
}) {
  await requireOnboardedUser({ redirectTo: "/auth/signin" });
  const { classSlug } = await params;

  const classroom = await db.query.classroom.findFirst({
    where: (c, { eq }) => eq(c.slug, classSlug),
    columns: { id: true },
  });
  if (!classroom) notFound();

  return (
    <div className="flex w-full flex-1 flex-col items-center gap-4 p-4">
      <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col gap-4 py-8">
        <ClassDetail classroomId={classroom.id} />
      </div>
    </div>
  );
}
