import { eq, isNull } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { classroom, contest, exercise, lesson, problem } from "@/drizzle/schema";
import { generateSlug } from "@/lib/slug";

async function main() {
  const problemsMissingSlug = await db.query.problem.findMany({
    where: isNull(problem.slug),
    columns: { id: true, title: true },
  });
  for (const p of problemsMissingSlug) {
    await db
      .update(problem)
      .set({ slug: generateSlug(p.title) })
      .where(eq(problem.id, p.id));
  }
  console.log(`Backfilled ${problemsMissingSlug.length} problem slug(s).`);

  const contestsMissingSlug = await db.query.contest.findMany({
    where: isNull(contest.slug),
    columns: { id: true, name: true },
  });
  for (const c of contestsMissingSlug) {
    await db
      .update(contest)
      .set({ slug: generateSlug(c.name) })
      .where(eq(contest.id, c.id));
  }
  console.log(`Backfilled ${contestsMissingSlug.length} contest slug(s).`);

  const classroomsMissingSlug = await db.query.classroom.findMany({
    where: isNull(classroom.slug),
    columns: { id: true, name: true },
  });
  for (const c of classroomsMissingSlug) {
    await db
      .update(classroom)
      .set({ slug: generateSlug(c.name) })
      .where(eq(classroom.id, c.id));
  }
  console.log(`Backfilled ${classroomsMissingSlug.length} classroom slug(s).`);

  const lessonsMissingSlug = await db.query.lesson.findMany({
    where: isNull(lesson.slug),
    columns: { id: true, title: true },
  });
  for (const l of lessonsMissingSlug) {
    await db
      .update(lesson)
      .set({ slug: generateSlug(l.title) })
      .where(eq(lesson.id, l.id));
  }
  console.log(`Backfilled ${lessonsMissingSlug.length} lesson slug(s).`);

  const exercisesMissingSlug = await db.query.exercise.findMany({
    where: isNull(exercise.slug),
    columns: { id: true },
    with: { problem: { columns: { title: true } } },
  });
  for (const e of exercisesMissingSlug) {
    await db
      .update(exercise)
      .set({ slug: generateSlug(e.problem.title) })
      .where(eq(exercise.id, e.id));
  }
  console.log(`Backfilled ${exercisesMissingSlug.length} exercise slug(s).`);
}

main().then(() => process.exit(0));
