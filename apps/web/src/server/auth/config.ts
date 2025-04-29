import { PrismaAdapter } from "@auth/prisma-adapter";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 */
declare module "next-auth" {
	interface Session extends DefaultSession {
		user: {
			id: string;
			name: string;
			role: string;
		} & DefaultSession["user"];
		accessToken: string;
		refreshToken: string;
	}

	interface User {
		role: string;
		accessToken: string;
		refreshToken: string;
	}
}

/**
 * NextAuth configuration
 */
export const authConfig = {
	providers: [
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				email: { label: "Email", type: "text" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				const res = await fetch("http://localhost:4000/api/auth/signin", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						email: credentials.email,
						password: credentials.password,
					}),
				});

				const user = await res.json();

				if (res.ok && user?.accessToken) {
					return user;
				}

				return null;
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.name = user.name;
				token.role = user.role;
				token.accessToken = user.accessToken;
				token.refreshToken = user.refreshToken;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.id = token.id as string;
				session.user.name = token.name as string;
				session.user.role = token.role as string;
			}
			session.accessToken = token.accessToken as string;
			session.refreshToken = token.refreshToken as string;
			return session;
		},
	},
	session: {
		strategy: "jwt",
	},
} satisfies NextAuthConfig;
