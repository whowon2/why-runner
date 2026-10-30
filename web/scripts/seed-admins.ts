// Promotes every user whose email is in the comma-separated
// SURVEY_ADMIN_EMAILS to `role = 'admin'`. Run once per environment after
// migration 0051: `bun db:seed:admins`. Idempotent and never demotes, so an
// admin demoted on /admin/users stays demoted unless their email is still
// listed and the script is rerun.
import { inArray, sql } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { user } from "@/drizzle/schema";

async function main() {
  const emails = [
    ...new Set(
      (process.env.SURVEY_ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  if (emails.length === 0) {
    console.log("SURVEY_ADMIN_EMAILS is empty; nothing to do.");
    return;
  }

  const promoted = await db
    .update(user)
    .set({ role: "admin" })
    .where(inArray(sql`lower(${user.email})`, emails))
    .returning({ email: user.email });

  const found = new Set(promoted.map((u) => u.email.toLowerCase()));
  for (const email of emails) {
    console.log(`${found.has(email) ? "admin    " : "not found"}  ${email}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
