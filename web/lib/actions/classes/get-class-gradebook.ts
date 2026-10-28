"use server";

import { z } from "zod";
import { ok } from "@/lib/action-result";
import { assertClassOwner } from "@/lib/actions/classes/assert-class-member";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { loadClassResultsData } from "@/lib/classes/load-class-results-data";
import { buildGradebook } from "@/lib/gradebook";

/**
 * Owner-only: every student × every published lesson exercise, scored like
 * lesson review. Only numbers leave the server, never `submission.output`.
 */
export async function getClassGradebook(classroomId: string) {
  const id = z.uuid().parse(classroomId);
  const currentUser = await getCurrentUser({});
  const classroom = await assertClassOwner(id, currentUser.id);
  const data = await loadClassResultsData(classroom);

  return ok({
    classroom: { id: classroom.id, name: classroom.name, slug: classroom.slug },
    ...buildGradebook({
      lessons: data.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        slug: l.slug,
        dueDate: l.dueDate,
        exercises: l.exercises.map((e) => ({
          id: e.id,
          problemTitle: e.problemTitle,
        })),
      })),
      students: data.students,
      lessonSubmissions: data.lessonSubmissions.map((s) => ({
        userId: s.userId,
        lessonId: s.lessonId,
      })),
      completions: data.completions.map((c) => ({
        userId: c.userId,
        exerciseId: c.exerciseId,
        output: c.submission?.output ?? null,
      })),
    }),
  });
}
