import type { ThemePreset } from "./types";

export const DEFAULT_PRESET_ID = "linux-rice";

export const PRESETS: ThemePreset[] = [
  {
    id: "linux-rice",
    name: "linux rice",
    light: {
      background: "oklch(0.99 0 0)",
      main: "oklch(0.55 0.16 145)",
      text: "oklch(0.15 0 0)",
      sub: "oklch(0.45 0 0)",
      caret: "oklch(0.55 0.16 145)",
      error: "oklch(0.577 0.245 27.325)",
    },
    dark: {
      background: "oklch(0.09 0 0)",
      main: "oklch(0.75 0.19 145)",
      text: "oklch(0.95 0 0)",
      sub: "oklch(0.65 0 0)",
      caret: "oklch(0.75 0.19 145)",
      error: "oklch(0.704 0.191 22.216)",
    },
  },
  {
    id: "nord",
    name: "nord",
    light: {
      background: "oklch(0.97 0.005 240)",
      main: "oklch(0.55 0.1 240)",
      text: "oklch(0.25 0.02 240)",
      sub: "oklch(0.5 0.02 240)",
      caret: "oklch(0.55 0.1 240)",
      error: "oklch(0.6 0.2 25)",
    },
    dark: {
      background: "oklch(0.25 0.02 240)",
      main: "oklch(0.75 0.08 220)",
      text: "oklch(0.92 0.01 240)",
      sub: "oklch(0.65 0.02 240)",
      caret: "oklch(0.75 0.08 220)",
      error: "oklch(0.65 0.18 25)",
    },
  },
  {
    id: "gruvbox",
    name: "gruvbox",
    light: {
      background: "oklch(0.95 0.02 90)",
      main: "oklch(0.55 0.15 45)",
      text: "oklch(0.25 0.02 60)",
      sub: "oklch(0.5 0.03 60)",
      caret: "oklch(0.55 0.15 45)",
      error: "oklch(0.55 0.2 25)",
    },
    dark: {
      background: "oklch(0.22 0.01 60)",
      main: "oklch(0.75 0.14 70)",
      text: "oklch(0.9 0.02 80)",
      sub: "oklch(0.65 0.03 70)",
      caret: "oklch(0.75 0.14 70)",
      error: "oklch(0.65 0.2 25)",
    },
  },
  {
    id: "dracula",
    name: "dracula",
    light: {
      background: "oklch(0.96 0.01 300)",
      main: "oklch(0.55 0.2 300)",
      text: "oklch(0.25 0.02 300)",
      sub: "oklch(0.5 0.03 300)",
      caret: "oklch(0.55 0.2 300)",
      error: "oklch(0.6 0.22 15)",
    },
    dark: {
      background: "oklch(0.22 0.02 280)",
      main: "oklch(0.72 0.2 300)",
      text: "oklch(0.92 0.01 280)",
      sub: "oklch(0.65 0.03 280)",
      caret: "oklch(0.72 0.2 300)",
      error: "oklch(0.65 0.22 15)",
    },
  },
  {
    id: "solarized",
    name: "solarized",
    light: {
      background: "oklch(0.98 0.02 95)",
      main: "oklch(0.55 0.12 210)",
      text: "oklch(0.3 0.02 200)",
      sub: "oklch(0.55 0.03 200)",
      caret: "oklch(0.55 0.12 210)",
      error: "oklch(0.55 0.2 25)",
    },
    dark: {
      background: "oklch(0.2 0.02 200)",
      main: "oklch(0.65 0.1 210)",
      text: "oklch(0.85 0.02 95)",
      sub: "oklch(0.6 0.03 200)",
      caret: "oklch(0.65 0.1 210)",
      error: "oklch(0.6 0.2 25)",
    },
  },
  {
    id: "vaporwave",
    name: "vaporwave",
    light: {
      background: "oklch(0.96 0.02 320)",
      main: "oklch(0.65 0.22 320)",
      text: "oklch(0.3 0.05 280)",
      sub: "oklch(0.55 0.05 280)",
      caret: "oklch(0.65 0.22 320)",
      error: "oklch(0.6 0.22 20)",
    },
    dark: {
      background: "oklch(0.2 0.03 280)",
      main: "oklch(0.75 0.2 320)",
      text: "oklch(0.92 0.02 300)",
      sub: "oklch(0.65 0.04 280)",
      caret: "oklch(0.75 0.2 320)",
      error: "oklch(0.65 0.22 20)",
    },
  },
];

export function getPresetById(id: string): ThemePreset {
  return PRESETS.find((p) => p.id === id) ?? PRESETS[0];
}
