import "@/styles/globals.css";

import type { Metadata } from "next";

import { Header } from "@/components/header/header";
import { ThemeProvider } from "@/providers/theme-provider";
import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "sonner";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Why Runner",
  description: "Code plataform",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="">
        <TRPCReactProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Header />

            {children}
            <Footer />
            <Toaster />
          </ThemeProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
