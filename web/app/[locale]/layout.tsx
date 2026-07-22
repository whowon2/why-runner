import { Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { CommandPaletteMount } from "@/components/command-palette/command-palette-mount";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/ui/sonner";
import { UserDock } from "@/components/user-dock";
import { DEFAULT_PRESET_ID, PRESETS } from "@/lib/themes/presets";
import { THEME_STORAGE_KEY } from "@/lib/themes/storage";
import { TOKEN_CSS_VAR } from "@/lib/themes/types";
import { Providers } from "@/providers";
import "../globals.css";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const THEME_INIT_SCRIPT = `(function(){try{var raw=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var presets=${JSON.stringify(PRESETS)};var vars=${JSON.stringify(TOKEN_CSS_VAR)};var mode=localStorage.getItem("theme")==="light"?"light":"dark";var stored=raw?JSON.parse(raw):{mode:"preset",presetId:${JSON.stringify(DEFAULT_PRESET_ID)}};var tokens;if(stored.mode==="custom"){tokens=stored.custom[mode];}else{var preset=presets.find(function(p){return p.id===stored.presetId;})||presets[0];tokens=preset[mode];}var root=document.documentElement;Object.keys(vars).forEach(function(key){root.style.setProperty(vars[key],tokens[key]);});}catch(e){}})();`;

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html lang="en" suppressHydrationWarning className={geistMono.variable}>
      <body className="flex flex-col min-h-screen justify-between scroll-smooth">
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static, build-time-generated script with no user input */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <NextIntlClientProvider>
          <NuqsAdapter>
            <Providers>
              <CommandPaletteMount />
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
