import "server-only";

import { and, eq, exists } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  classroom,
  contest,
  exercise,
  lesson,
  lessonSubmission,
  problemOnContest,
  submission,
  userOnContest,
} from "@/drizzle/schema";
import type { SurveyFormKey } from "@/drizzle/schemas/surveys";
import { SURVEY_DEFINITIONS } from "./forms";

export type SurveyEntity = {
  id: string;
  name: string;
  /** Page the survey is about, for links back. */
  href: string;
  /** Contests only: whether `endDate` has passed. Lessons are always true. */
  ended: boolean;
};

export type EligibleSurvey = {
  form: SurveyFormKey;
  entity: SurveyEntity;
};

const contestColumns = {
  id: contest.id,
  name: contest.name,
  slug: contest.slug,
  endDate: contest.endDate,
};

const lessonColumns = {
  id: lesson.id,
  name: lesson.title,
  slug: lesson.slug,
  classSlug: classroom.slug,
};

type ContestRow = {
  id: string;
  name: string;
  slug: string;
  endDate: Date | null;
};
type LessonRow = { id: string; name: string; slug: string; classSlug: string };

function contestEntity(row: ContestRow): SurveyEntity {
  return {
    id: row.id,
    name: row.name,
    href: `/contests/${row.slug}`,
    ended: !!row.endDate && row.endDate < new Date(),
  };
}

function lessonEntity(row: LessonRow): SurveyEntity {
  return {
    id: row.id,
    name: row.name,
    href: `/classes/${row.classSlug}/lessons/${row.slug}`,
    ended: true,
  };
}

const contestHasProblems = exists(
  db
    .select({ x: problemOnContest.contestId })
    .from(problemOnContest)
    .where(eq(problemOnContest.contestId, contest.id)),
);

const lessonHasExercises = exists(
  db
    .select({ x: exercise.id })
    .from(exercise)
    .where(eq(exercise.lessonId, lesson.id)),
);

/**
 * Rows the user is eligible to answer `form` for, optionally narrowed to one
 * entity. Rules (see the `evaluation-surveys` spec):
 * - contest_author: created the contest; published with ≥1 problem.
 * - contest_participant: accepted in a published contest with ≥1 submission.
 * - lesson_author: created the lesson; published with ≥1 exercise.
 * - lesson_student: has a `lessonSubmission` for the lesson.
 */
async function eligibleRows(
  userId: string,
  form: SurveyFormKey,
  entityId?: string,
): Promise<SurveyEntity[]> {
  switch (form) {
    case "contest_author": {
      const rows = await db
        .select(contestColumns)
        .from(contest)
        .where(
          and(
            eq(contest.createdBy, userId),
            eq(contest.status, "published"),
            contestHasProblems,
            entityId ? eq(contest.id, entityId) : undefined,
          ),
        );
      return rows.map(contestEntity);
    }
    case "contest_participant": {
      const rows = await db
        .select(contestColumns)
        .from(userOnContest)
        .innerJoin(contest, eq(contest.id, userOnContest.contestId))
        .where(
          and(
            eq(userOnContest.userId, userId),
            eq(userOnContest.joinStatus, "accepted"),
            eq(contest.status, "published"),
            exists(
              db
                .select({ x: submission.id })
                .from(submission)
                .where(
                  and(
                    eq(submission.contestId, contest.id),
                    eq(submission.userId, userId),
                  ),
                ),
            ),
            entityId ? eq(contest.id, entityId) : undefined,
          ),
        );
      return rows.map(contestEntity);
    }
    case "lesson_author": {
      const rows = await db
        .select(lessonColumns)
        .from(lesson)
        .innerJoin(classroom, eq(classroom.id, lesson.classroomId))
        .where(
          and(
            eq(lesson.createdBy, userId),
            eq(lesson.isPublished, true),
            lessonHasExercises,
            entityId ? eq(lesson.id, entityId) : undefined,
          ),
        );
      return rows.map(lessonEntity);
    }
    case "lesson_student": {
      const rows = await db
        .select(lessonColumns)
        .from(lessonSubmission)
        .innerJoin(lesson, eq(lesson.id, lessonSubmission.lessonId))
        .innerJoin(classroom, eq(classroom.id, lesson.classroomId))
        .where(
          and(
            eq(lessonSubmission.userId, userId),
            entityId ? eq(lesson.id, entityId) : undefined,
          ),
        );
      return rows.map(lessonEntity);
    }
  }
}

/** The entity if the user may answer `form` for it, `null` otherwise. */
export async function checkEligibility(
  userId: string,
  form: SurveyFormKey,
  entityId: string,
): Promise<SurveyEntity | null> {
  const [row] = await eligibleRows(userId, form, entityId);
  return row ?? null;
}

/** Every form × entity the user may answer. */
export async function listEligible(userId: string): Promise<EligibleSurvey[]> {
  const forms = Object.keys(SURVEY_DEFINITIONS) as SurveyFormKey[];
  const perForm = await Promise.all(
    forms.map(async (form) =>
      (await eligibleRows(userId, form)).map((entity) => ({ form, entity })),
    ),
  );
  return perForm.flat();
}

/** Name and link of a survey's entity regardless of eligibility. */
export async function findSurveyEntity(
  form: SurveyFormKey,
  entityId: string,
): Promise<SurveyEntity | null> {
  if (SURVEY_DEFINITIONS[form].entity === "contest") {
    const [row] = await db
      .select(contestColumns)
      .from(contest)
      .where(eq(contest.id, entityId));
    return row ? contestEntity(row) : null;
  }
  const [row] = await db
    .select(lessonColumns)
    .from(lesson)
    .innerJoin(classroom, eq(classroom.id, lesson.classroomId))
    .where(eq(lesson.id, entityId));
  return row ? lessonEntity(row) : null;
}
