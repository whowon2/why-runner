import { notFound } from "next/navigation";
import { db } from "@/drizzle/db";
import { getClassAccess } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/require-user";
import { ClassGradebook } from "../../_components/class-gradebook";

export default async function ClassGradebookPage({
  params,
}: {
  params: Promise<{ classSlug: string }>;
}) {
  const user = await requireUser({ redirectTo: "/auth/signin" });
  const { classSlug } = await params;

  const classroom = await db.query.classroom.findFirst({
    where: (c, { eq }) => eq(c.slug, classSlug),
    columns: { id: true },
  });
  // Class managers only; the action enforces it too.
  if (!classroom || !(await getClassAccess(classroom.id, user.id)).canManage)
    notFound();

  return (
    <div className="flex w-full flex-1 flex-col items-center gap-4 p-4">
      <ClassGradebook classroomId={classroom.id} />
    </div>
  );
}
