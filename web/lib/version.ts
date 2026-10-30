import { env } from "@/env";
import pkg from "@/package.json";

/** Web app version from package.json; bump it to cut a `web-v*` release. */
export const APP_VERSION = pkg.version;

/** Short commit of this deployment ("dev" outside Vercel). */
export const APP_COMMIT = env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev";
