import '@/styles/globals.css';

import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { Toaster } from '@/components/ui/sonner';
import { TRPCReactProvider } from '@/trpc/react';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { hasLocale, NextIntlClientProvider } from 'next-intl';

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
	params
}: Readonly<{ children: React.ReactNode, params: Promise<{locale: string}>}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

	return (
		<html className={`${geist.variable}`} lang="en" suppressHydrationWarning>
			<body>
				<TRPCReactProvider>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						disableTransitionOnChange
						enableSystem
					>
					<NextIntlClientProvider>

						<Header />
						{children}
						<Toaster />
						{/* <Footer /> */}
					</NextIntlClientProvider>
					</ThemeProvider>
				</TRPCReactProvider>
			</body>
		</html>
	);
}
