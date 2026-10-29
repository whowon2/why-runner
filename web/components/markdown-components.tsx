import type { Components } from "react-markdown";
import { cn } from "@/lib/utils";

// Pass as `components` to every ReactMarkdown: code in problem statements and
// AI answers stays literal under browser page translation, while the prose
// around it can still be translated.
export const markdownComponents: Components = {
  pre: ({ node: _, className, ...props }) => (
    <pre translate="no" className={cn("notranslate", className)} {...props} />
  ),
  code: ({ node: _, className, ...props }) => (
    <code translate="no" className={cn("notranslate", className)} {...props} />
  ),
};
