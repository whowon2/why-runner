export type PublishContestFieldError =
  | "name"
  | "startDate"
  | "endDate"
  | "problems";

export const PUBLISH_MISSING_FIELDS_PREFIX = "MISSING_FIELDS:";
