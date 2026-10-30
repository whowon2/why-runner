import { z } from "zod";

/** Shared input of the admin list actions. */
export const adminListSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).default(""),
});

export type AdminListParams = z.input<typeof adminListSchema>;
