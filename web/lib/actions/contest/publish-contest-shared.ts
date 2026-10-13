export type PublishContestFieldError =
  | "name"
  | "startDate"
  | "startDatePast"
  | "endDate"
  | "problems";

export const PUBLISH_MISSING_FIELDS = "MISSING_FIELDS";
