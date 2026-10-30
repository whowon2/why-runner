import { APP_COMMIT, APP_VERSION } from "@/lib/version";

// Which web build is deployed, e.g. `curl https://why-runner.vercel.app/api/version`.
export function GET() {
  return Response.json({ version: APP_VERSION, commit: APP_COMMIT });
}
