"use server";

import { z } from "zod";
import { ok } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { assertCanManageClass } from "@/lib/auth/permissions";
import { buildClassResults, classResultsToCsv } from "@/lib/class-results";
import {
  loadClassActivity,
  loadClassResultsData,
} from "@/lib/classes/load-class-results-data";

/**
 * Class managers only (owner, co-teachers, admins): one CSV row per
 * student × published exercise with the graded snapshot's verdict/tests/
 * score and live attempt activity. Only the CSV leaves the server — counts and statuses, never code or judge output.
 */
export async function exportClassResults(classroomId: string) {
  const id = z.uuid().parse(classroomId);
  const currentUser = await getCurrentUser({});
  const { classroom } = await assertCanManageClass(id, currentUser.id);
  const data = await loadClassResultsData(classroom);
  const activity = await loadClassActivity(data.exerciseIds, data.studentIds);

  const csv = classResultsToCsv(
    buildClassResults({
      lessons: data.lessons,
      students: data.students,
      lessonSubmissions: data.lessonSubmissions,
      completions: data.completions,
      activity,
    }),
  );

  return ok({
    filename: `${classroom.slug}-results-${new Date().toISOString().slice(0, 10)}.csv`,
    csv,
  });
}
