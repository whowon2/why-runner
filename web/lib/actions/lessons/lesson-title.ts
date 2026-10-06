export const LESSON_TITLE_MAX_LENGTH = 120;

/** Trims an assignment title and rejects empty or overlong ones. */
export function normalizeLessonTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) throw new Error("Title is required");
  if (trimmed.length > LESSON_TITLE_MAX_LENGTH) {
    throw new Error(
      `Title must be at most ${LESSON_TITLE_MAX_LENGTH} characters`,
    );
  }
  return trimmed;
}
