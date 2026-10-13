import { sql } from "drizzle-orm";
import { after } from "next/server";
import { db } from "@/drizzle/db";
import { env } from "@/env";

const FLY_API = "https://api.machines.dev/v1";

type JudgeChannel = "new_submission" | "new_validation";

/**
 * Tell the judge a job is pending: pg_notify for a running worker, plus a
 * Fly Machines start for one that idle-exited (JUDGE_IDLE_EXIT_SECS). A
 * freshly started judge drains all pending rows on boot, so the missed
 * notification is harmless. The wake runs after the response is sent and
 * is a no-op when FLY_API_TOKEN is unset (local dev).
 */
export async function notifyJudge(channel: JudgeChannel, id: string) {
  await db.execute(sql`SELECT pg_notify(${channel}, ${id})`);
  after(wakeJudge);
}

async function wakeJudge() {
  const token = env.FLY_API_TOKEN;
  if (!token) return;
  const app = env.FLY_JUDGE_APP;
  const headers = { Authorization: `Bearer ${token}` };

  try {
    const res = await fetch(`${FLY_API}/apps/${app}/machines`, { headers });
    if (!res.ok) throw new Error(`list machines: ${res.status}`);
    const machines: { id: string; state: string }[] = await res.json();

    await Promise.all(
      machines
        .filter((m) => m.state === "stopped" || m.state === "suspended")
        .map(async (m) => {
          const r = await fetch(
            `${FLY_API}/apps/${app}/machines/${m.id}/start`,
            { method: "POST", headers },
          );
          if (!r.ok) throw new Error(`start ${m.id}: ${r.status}`);
        }),
    );
  } catch (e) {
    console.error("Failed to wake judge:", e);
  }
}
