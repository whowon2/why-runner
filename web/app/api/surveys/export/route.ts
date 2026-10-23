import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import z from "zod";
import { SURVEY_FORMS } from "@/drizzle/schemas/surveys";
import { auth } from "@/lib/auth";
import { isSurveyAdmin } from "@/lib/surveys/admin";
import { toCsv } from "@/lib/surveys/csv";
import { SURVEY_DEFINITIONS } from "@/lib/surveys/forms";
import { loadResponses } from "@/lib/surveys/results";

const querySchema = z.object({
  form: z.enum(SURVEY_FORMS),
  entityId: z.uuid().optional(),
});

/**
 * Anonymous CSV export of one survey form (`?form=…&entityId=…`). A route
 * handler rather than a server action because it is a file download.
 * Researcher-only; anyone else gets a 404.
 */
export async function GET(request: NextRequest) {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!session || !isSurveyAdmin(session.user)) {
    return new Response("Not found", { status: 404 });
  }

  const parsed = querySchema.safeParse({
    form: request.nextUrl.searchParams.get("form"),
    entityId: request.nextUrl.searchParams.get("entityId") || undefined,
  });
  if (!parsed.success) return new Response("Bad request", { status: 400 });
  const { form, entityId } = parsed.data;

  const rows = await loadResponses(form, entityId);
  const csv = toCsv(SURVEY_DEFINITIONS[form], rows);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="whyrunner-${form}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
