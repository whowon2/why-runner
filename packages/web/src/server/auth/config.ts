import { env } from "@/env";
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
			email: string;
			image: string;
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
				try {
					const res = await fetch(`${env.BACKEND_URL}/api/auth/signin`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							email: credentials.email,
							password: credentials.password,
						}),
					});

					if (res.ok) {
						const user = await res.json();
						return user;
					}

					return null;
				} catch (error) {
					return null;
				}
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.name = user.name;
				token.role = user.role;
				token.email = user.email;
				token.image = user.image;
				token.accessToken = user.accessToken;
				token.refreshToken = user.refreshToken;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.id = token.id as string;
				session.user.name = token.name as string;
				session.user.email = token.email as string;
				session.user.image = token.image as string;
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
	pages: {
		signIn: "/auth/signin",
	},
} satisfies NextAuthConfig;
