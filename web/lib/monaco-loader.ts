import { loader } from "@monaco-editor/react";

/**
 * Load Monaco from this origin (`public/monaco/vs`, copied from the installed
 * `monaco-editor` by `scripts/copy-static-assets.mjs`) instead of the
 * loader's jsDelivr default, so the editor works in labs that block every
 * domain but ours. Import before rendering `<Editor>` or calling
 * `loader.init()`.
 */
loader.config({ paths: { vs: "/monaco/vs" } });

export { loader };
