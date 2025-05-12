import "@/styles/globals.css";

import type { Metadata } from "next";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header/header";
import { ThemeProvider } from "@/providers/theme-provider";
import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "sonner";

export const metadata: Metadata = {
	title: "Why Runner",
	description: "Code plataform",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" suppressHydrationWarning={true}>
			<body className="flex min-h-screen flex-col justify-between">
				<TRPCReactProvider>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem={true}
						disableTransitionOnChange={true}
					>
						<Header />

						{children}
						<Toaster />
						<Footer />
					</ThemeProvider>
				</TRPCReactProvider>
			</body>
		</html>
	);
}
