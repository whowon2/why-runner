import '@/styles/globals.css';

import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from 'next-themes';
import { UserDock } from '@/components/dock';
import { Footer } from '@/components/footer';
import { Toaster } from '@/components/ui/sonner';
import { routing } from '@/i18n/routing';
import { auth } from '@/server/auth';
import { TRPCReactProvider } from '@/trpc/react';

export const metadata: Metadata = {
	description: '',
	icons: [{ rel: 'icon', url: '/favicon.ico' }],
	title: 'Why Runner',
};

const geist = Geist({
	subsets: ['latin'],
	variable: '--font-geist-sans',
});

export default async function RootLayout({
	children,
	params,
}: Readonly<{
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}>) {
	const { locale } = await params;

	if (!hasLocale(routing.locales, locale)) {
		notFound();
	}

	const session = await auth();

	return (
		<html className={`${geist.variable}`} lang="en" suppressHydrationWarning>
			<body className="flex flex-col min-h-screen justify-between scroll-smooth">
				<TRPCReactProvider>
					<NextIntlClientProvider>
						<ThemeProvider attribute="class" defaultTheme="dark">
							{children}
							<Toaster />
							<UserDock session={session} />
							<Footer />
						</ThemeProvider>
					</NextIntlClientProvider>
				</TRPCReactProvider>
			</body>
		</html>
	);
}
