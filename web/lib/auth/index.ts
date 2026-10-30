import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/drizzle/db";
import { env } from "@/env";
import {
  type IdentityErrorCode,
  isRaTaken,
  isUsernameTaken,
} from "@/lib/identity";
import {
  generateUsername,
  optionalRaSchema,
  usernameSchema,
} from "@/lib/username";

// The client maps these codes to translated field errors (sign-up tab).
const identityError = (code: IdentityErrorCode) =>
  new APIError("BAD_REQUEST", { message: code });

async function resolveUsername(input: unknown, email: string) {
  // Social logins send no username: generate one, editable in the profile.
  if (input === undefined || input === null || input === "") {
    return generateUsername(email.split("@")[0]);
  }
  const parsed = usernameSchema.safeParse(input);
  if (!parsed.success) throw identityError("USERNAME_INVALID");
  if (await isUsernameTaken(parsed.data)) throw identityError("USERNAME_TAKEN");
  return parsed.data;
}

async function resolveRa(input: unknown) {
  if (input === undefined || input === null) return null;
  const parsed = optionalRaSchema.safeParse(input);
  if (!parsed.success) throw identityError("RA_INVALID");
  if (parsed.data && (await isRaTaken(parsed.data))) {
    throw identityError("RA_TAKEN");
  }
  return parsed.data;
}

export const auth = betterAuth({
  user: {
    additionalFields: {
      // Signup inputs. Later edits go through `updateProfile` only (see the
      // /update-user guard below).
      username: { type: "string", required: false, input: true },
      ra: { type: "string", required: false, input: true },
      // UI hint only (cached session); authorization reads it fresh via
      // `isAdmin` in lib/auth/permissions.ts.
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/update-user") return;
      const body = (ctx.body ?? {}) as Record<string, unknown>;
      if ("username" in body || "ra" in body) {
        throw new APIError("BAD_REQUEST", {
          message: "Use the profile form to change username or RA",
        });
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return {
            data: {
              ...user,
              username: await resolveUsername(user.username, user.email),
              ra: await resolveRa(user.ra),
            },
          };
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    github: {
      clientId: env.GITHUB_ID,
      clientSecret: env.GITHUB_SECRET,
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 min
    },
  },
  plugins: [nextCookies()],
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
});
