"use client";

import { PRESETS } from "@/lib/themes/presets";
import { useThemeTokens } from "@/providers/theme-tokens-provider";

export function PresetGrid() {
  const { stored, activeMode, setPreset } = useThemeTokens();
  const activePresetId = stored.mode === "preset" ? stored.presetId : null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {PRESETS.map((preset) => {
        const tokens = preset[activeMode];
        const isActive = preset.id === activePresetId;

        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => setPreset(preset.id)}
            style={{
              backgroundColor: tokens.background,
              color: tokens.text,
              borderColor: isActive ? tokens.main : tokens.sub,
            }}
            className={`border px-4 py-6 text-sm font-medium cursor-pointer text-left transition-colors ${
              isActive ? "border-2" : "border"
            }`}
          >
            {preset.name}
          </button>
        );
      })}
    </div>
  );
}
