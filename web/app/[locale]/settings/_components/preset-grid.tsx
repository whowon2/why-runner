"use client";

import { derivePalette } from "@/lib/themes/palette";
import { PRESETS } from "@/lib/themes/presets";
import { cn } from "@/lib/utils";
import { useThemeTokens } from "@/providers/theme-tokens-provider";

/**
 * One card per preset in the current light/dark mode: its background, text
 * and a strip of its accent and syntax colors.
 */
export function PresetGrid({ className }: { className?: string }) {
  const { stored, activeMode, setPreset } = useThemeTokens();
  const activePresetId = stored.mode === "preset" ? stored.presetId : null;

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4",
        className,
      )}
    >
      {PRESETS.map((preset) => {
        const tokens = preset[activeMode];
        const palette =
          preset.palette?.[activeMode] ?? derivePalette(tokens, activeMode);
        const swatches = [
          tokens.main,
          palette.syntax.keyword,
          palette.syntax.string,
          palette.syntax.function,
          palette.syntax.number,
          tokens.error,
        ];
        const isActive = preset.id === activePresetId;

        return (
          <button
            aria-pressed={isActive}
            className={cn(
              "flex cursor-pointer flex-col gap-3 border px-4 py-4 text-left font-medium text-sm transition-colors",
              isActive ? "border-2" : "border",
            )}
            key={preset.id}
            onClick={() => setPreset(preset.id)}
            style={{
              backgroundColor: tokens.background,
              color: tokens.text,
              borderColor: isActive ? tokens.main : tokens.sub,
            }}
            type="button"
          >
            {preset.name}
            <span aria-hidden className="flex h-2">
              {swatches.map((color, i) => (
                <span
                  className="flex-1"
                  key={i}
                  style={{ backgroundColor: color }}
                />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
