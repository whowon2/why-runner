import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { Resend } from "resend";
import { db } from "@/drizzle/db";
import { env } from "@/env";
import { generateUsername } from "@/lib/username";

const resend = new Resend(env.RESEND_API_KEY);

export const auth = betterAuth({
  user: {
    additionalFields: {
      username: { type: "string", required: false, input: false },
      finishedOnboarding: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return {
            data: {
              ...user,
              username: generateUsername(user.email.split("@")[0]),
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
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: user.email,
        subject: "Verify your email",
        html: `<p>Click the link below to verify your account:</p><p><a href="${url}">${url}</a></p>`,
      });
    },
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
