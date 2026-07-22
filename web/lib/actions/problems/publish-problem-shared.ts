export type PublishProblemFieldError =
  | "title"
  | "description"
  | "difficulty"
  | "tests";

export const PUBLISH_MISSING_FIELDS_PREFIX = "MISSING_FIELDS:";

export function getMissingProblemFields(problem: {
  title: string;
  description: string;
  difficulty: string | null;
  inputs: string[];
  outputs: string[];
}): PublishProblemFieldError[] {
  const fields: PublishProblemFieldError[] = [];
  if (!problem.title.trim()) fields.push("title");
  if (!problem.description.trim()) fields.push("description");
  if (!problem.difficulty) fields.push("difficulty");
  if (
    problem.inputs.length === 0 ||
    problem.inputs.length !== problem.outputs.length ||
    problem.inputs.some((v) => !v.trim()) ||
    problem.outputs.some((v) => !v.trim())
  )
    fields.push("tests");
  return fields;
}
