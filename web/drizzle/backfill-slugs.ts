import { eq, isNull } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { contest, problem } from "@/drizzle/schema";
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
}

main().then(() => process.exit(0));
