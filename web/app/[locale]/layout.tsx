import { Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { CommandPaletteMount } from "@/components/command-palette/command-palette-mount";
import { Footer } from "@/components/footer";
import { SiteChrome } from "@/components/site-chrome";
import { Toaster } from "@/components/ui/sonner";
import { UserDock } from "@/components/user-dock";
import { DEFAULT_PRESET_ID, PRESETS } from "@/lib/themes/presets";
import {
  derivePalette,
  resolveTheme,
  themeCssVars,
} from "@/lib/themes/palette";
import { THEME_STORAGE_KEY } from "@/lib/themes/storage";
import { TOKEN_CSS_VAR } from "@/lib/themes/types";
import { Providers } from "@/providers";
import "../globals.css";
import { NuqsAdapter } from "nuqs/adapters/next/app";

// CSS variables per preset and mode, so the init script only looks them up.
const PRESET_VARS = Object.fromEntries(
  PRESETS.map((preset) => [
    preset.id,
    {
      light: themeCssVars(
        resolveTheme({ mode: "preset", presetId: preset.id }, "light"),
      ),
      dark: themeCssVars(
        resolveTheme({ mode: "preset", presetId: preset.id }, "dark"),
      ),
    },
  ]),
);
// A custom theme's palette doesn't depend on its tokens, only on the mode.
const CUSTOM_EXTRA_VARS = {
  light: themeCssVars({
    tokens: PRESETS[0].light,
    palette: derivePalette(PRESETS[0].light, "light"),
  }),
  dark: themeCssVars({
    tokens: PRESETS[0].dark,
    palette: derivePalette(PRESETS[0].dark, "dark"),
  }),
};

const THEME_INIT_SCRIPT = `(function(){try{var raw=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var presets=${JSON.stringify(PRESET_VARS)};var tokenVars=${JSON.stringify(TOKEN_CSS_VAR)};var extra=${JSON.stringify(CUSTOM_EXTRA_VARS)};var mode=localStorage.getItem("theme")==="light"?"light":"dark";var stored=raw?JSON.parse(raw):{mode:"preset",presetId:${JSON.stringify(DEFAULT_PRESET_ID)}};var vars={};if(stored.mode==="custom"){var tokens=stored.custom[mode];vars["--success"]=extra[mode]["--success"];vars["--warning"]=extra[mode]["--warning"];Object.keys(tokenVars).forEach(function(key){vars[tokenVars[key]]=tokens[key];});}else{vars=(presets[stored.presetId]||presets[${JSON.stringify(DEFAULT_PRESET_ID)}])[mode];}var root=document.documentElement;Object.keys(vars).forEach(function(name){root.style.setProperty(name,vars[name]);});}catch(e){}})();`;

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
              <CommandPaletteMount>
                {children}
                <Toaster />
                <SiteChrome>
                  <UserDock />
                  <Footer />
                </SiteChrome>
              </CommandPaletteMount>
            </Providers>
          </NuqsAdapter>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
