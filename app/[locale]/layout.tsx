import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/ui/sonner";
import { UserDock } from "@/components/user-dock";
import { Providers } from "@/providers";
import "../globals.css";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export const metadata: Metadata = {
  description: "",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  title: "Why Runner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen justify-between scroll-smooth">
        <NextIntlClientProvider>
          <NuqsAdapter>
            <Providers>
              {children}
              <Toaster />
              <UserDock />
              <Footer />
            </Providers>
          </NuqsAdapter>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
