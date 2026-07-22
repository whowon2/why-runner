import { sql } from "drizzle-orm";
import { db } from "@/drizzle/db";

const BASE36_DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function toBase36(n: number): string {
  if (n === 0) return "0";
  let out = "";
  while (n > 0) {
    out = BASE36_DIGITS[n % 36] + out;
    n = Math.floor(n / 36);
  }
  return out;
}

export async function generateProblemCode(): Promise<string> {
  const result = await db.execute<{ nextval: string }>(
    sql`select nextval('problem_code_seq')`,
  );
  return toBase36(Number(result.rows[0].nextval));
}
