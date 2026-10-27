"use server";

import {
  and,
  asc,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  lte,
  ne,
  notExists,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  classroom,
  classroomMembership,
  contest,
  exercise,
  lesson,
  lessonSubmission,
  problem,
  submission,
  userOnContest,
} from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const PENDING_LESSONS_LIMIT = 5;
const RECENT_SOLVES_LIMIT = 5;
const SUGGESTIONS_LIMIT = 3;

export type HomeContestStatus = "upcoming" | "running" | "finished";

const contestColumns = {
  id: contest.id,
  slug: contest.slug,
  name: contest.name,
  startDate: contest.startDate,
  endDate: contest.endDate,
};

const problemColumns = {
  id: problem.id,
  slug: problem.slug,
  code: problem.code,
  title: problem.title,
  difficulty: problem.difficulty,
};

// Nullable difficulty ranks as medium, so unrated problems neither lead the
// "easiest first" list for new users nor get buried.
const difficultyRank = sql<number>`case ${problem.difficulty} when 'easy' then 0 when 'hard' then 2 else 1 end`;

function contestStatus(
  c: { startDate: Date | null; endDate: Date | null },
  now: Date,
): HomeContestStatus {
  if (!c.startDate || c.startDate > now) return "upcoming";
  if (c.endDate && c.endDate <= now) return "finished";
  return "running";
}

/** Everything the signed-in user's `/home` dashboard shows, in one round trip. */
export async function getHomeData() {
  const currentUser = await getCurrentUser({});
  const userId = currentUser.id;
  const now = new Date();

  const [pendingLessons, runningContests, recentSolves, solvedProblems] =
    await Promise.all([
      getPendingLessons(userId, now),
      db
        .select(contestColumns)
        .from(userOnContest)
        .innerJoin(contest, eq(contest.id, userOnContest.contestId))
        .where(
          and(
            eq(userOnContest.userId, userId),
            eq(userOnContest.joinStatus, "accepted"),
            eq(contest.status, "published"),
            lte(contest.startDate, sql`now()`),
            gt(contest.endDate, sql`now()`),
          ),
        )
        .orderBy(asc(contest.endDate)),
      getRecentSolves(userId),
      // Every problem the user ever passed — excluded from suggestions and
      // used to steer them by tag/difficulty.
      db
        .select({ id: problem.id, tags: problem.tags, rank: difficultyRank })
        .from(problem)
        .where(
          inArray(
            problem.id,
            db
              .selectDistinct({ id: submission.problemId })
              .from(submission)
              .where(
                and(
                  eq(submission.userId, userId),
                  eq(submission.status, "PASSED"),
                ),
              ),
          ),
        ),
    ]);

  const runningIds = runningContests.map((c) => c.id);

  const [lastJoined, suggestedProblems, suggestedContests] = await Promise.all([
    db
      .select(contestColumns)
      .from(userOnContest)
      .innerJoin(contest, eq(contest.id, userOnContest.contestId))
      .where(
        and(
          eq(userOnContest.userId, userId),
          runningIds.length ? notInArray(contest.id, runningIds) : undefined,
        ),
      )
      .orderBy(
        desc(
          sql`coalesce(${userOnContest.joinedAt}, ${contest.startDate}, ${contest.createdAt})`,
        ),
      )
      .limit(1),
    getSuggestedProblems(userId, solvedProblems),
    db
      .select(contestColumns)
      .from(contest)
      .where(
        and(
          eq(contest.status, "published"),
          eq(contest.isPrivate, false),
          or(isNull(contest.endDate), gt(contest.endDate, sql`now()`)),
          notExists(
            db
              .select({ one: sql`1` })
              .from(userOnContest)
              .where(
                and(
                  eq(userOnContest.contestId, contest.id),
                  eq(userOnContest.userId, userId),
                ),
              ),
          ),
        ),
      )
      .orderBy(sql`${contest.startDate} asc nulls last`)
      .limit(SUGGESTIONS_LIMIT),
  ]);

  return {
    pendingLessons,
    runningContests,
    lastJoinedContest: lastJoined[0]
      ? { ...lastJoined[0], status: contestStatus(lastJoined[0], now) }
      : null,
    recentSolves,
    suggestedProblems,
    suggestedContests: suggestedContests.map((c) => ({
      ...c,
      status: contestStatus(c, now),
    })),
  };
}

export type HomeData = Awaited<ReturnType<typeof getHomeData>>;

/** Published lessons in classes the user joined (not owns) that they haven't handed in yet. */
async function getPendingLessons(userId: string, now: Date) {
  const lessons = await db
    .select({
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      dueDate: lesson.dueDate,
      classSlug: classroom.slug,
      className: classroom.name,
    })
    .from(lesson)
    .innerJoin(classroom, eq(classroom.id, lesson.classroomId))
    .innerJoin(
      classroomMembership,
      and(
        eq(classroomMembership.classroomId, classroom.id),
        eq(classroomMembership.userId, userId),
      ),
    )
    .leftJoin(
      lessonSubmission,
      and(
        eq(lessonSubmission.lessonId, lesson.id),
        eq(lessonSubmission.userId, userId),
      ),
    )
    .where(
      and(
        eq(lesson.isPublished, true),
        ne(classroom.createdBy, userId),
        isNull(lessonSubmission.lessonId),
      ),
    )
    .orderBy(sql`${lesson.dueDate} asc nulls last`, asc(lesson.createdAt))
    .limit(PENDING_LESSONS_LIMIT);

  if (lessons.length === 0) return [];

  const exercises = await db
    .select({ id: exercise.id, lessonId: exercise.lessonId })
    .from(exercise)
    .where(
      inArray(
        exercise.lessonId,
        lessons.map((l) => l.id),
      ),
    );

  // Scoped by exerciseId, not problemId — same rule as `listClassLessons`.
  const passed = exercises.length
    ? await db
        .selectDistinct({ exerciseId: submission.exerciseId })
        .from(submission)
        .where(
          and(
            eq(submission.userId, userId),
            eq(submission.status, "PASSED"),
            inArray(
              submission.exerciseId,
              exercises.map((e) => e.id),
            ),
          ),
        )
    : [];
  const passedIds = new Set(passed.map((p) => p.exerciseId));

  return lessons.map((l) => {
    const lessonExercises = exercises.filter((e) => e.lessonId === l.id);
    return {
      ...l,
      exerciseCount: lessonExercises.length,
      passedCount: lessonExercises.filter((e) => passedIds.has(e.id)).length,
      isOverdue: l.dueDate !== null && l.dueDate < now,
    };
  });
}

/** Distinct problems with a passing submission, latest pass first. */
async function getRecentSolves(userId: string) {
  const solvedAt = sql<Date>`max(${submission.createdAt})`.mapWith(
    submission.createdAt,
  );

  return db
    .select({ ...problemColumns, solvedAt })
    .from(submission)
    .innerJoin(problem, eq(problem.id, submission.problemId))
    .where(and(eq(submission.userId, userId), eq(submission.status, "PASSED")))
    .groupBy(problem.id)
    .orderBy(desc(solvedAt))
    .limit(RECENT_SOLVES_LIMIT);
}

/**
 * Unsolved published problems by others, ranked by tag overlap with what the
 * user already solved, then by distance from their median difficulty (easy
 * for new users). The md5 tiebreak keeps the pick stable within a day.
 */
async function getSuggestedProblems(
  userId: string,
  solved: { id: string; tags: string[]; rank: number }[],
) {
  const myTags = [...new Set(solved.flatMap((p) => p.tags))];
  const ranks = solved.map((p) => p.rank).sort((a, b) => a - b);
  const targetRank = ranks.length ? ranks[Math.floor(ranks.length / 2)] : 0;

  // No tags to match → skip the term entirely (a bare `0` in ORDER BY would
  // be read as a column position).
  const tagOverlap = myTags.length
    ? sql`cardinality(array(select unnest(${problem.tags}) intersect select unnest(array[${sql.join(
        myTags.map((t) => sql`${t}`),
        sql`, `,
      )}]::problem_tag[])))`
    : undefined;

  return db
    .select(problemColumns)
    .from(problem)
    .where(
      and(
        eq(problem.status, "published"),
        ne(problem.createdBy, userId),
        solved.length
          ? notInArray(
              problem.id,
              solved.map((p) => p.id),
            )
          : undefined,
      ),
    )
    .orderBy(
      ...(tagOverlap ? [desc(tagOverlap)] : []),
      sql`abs(${difficultyRank} - ${targetRank})`,
      sql`md5(${problem.id}::text || current_date::text)`,
    )
    .limit(SUGGESTIONS_LIMIT);
}
