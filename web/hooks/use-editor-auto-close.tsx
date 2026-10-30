import { createLocalSetting } from "@/hooks/use-local-setting";

// Whether editors insert closing brackets/quotes; on unless turned off.
export const useEditorAutoClose = createLocalSetting(
  "whyrunner:editor-auto-close",
  (stored) => stored !== "false",
  String,
  true,
);
