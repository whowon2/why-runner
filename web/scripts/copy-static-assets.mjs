#!/usr/bin/env node
// Copies runtime assets the browser would otherwise fetch from third-party
// CDNs into public/, so the editors work when only the WhyRunner origin is
// reachable (exam labs that firewall everything else):
// - Monaco's AMD build (lib/monaco-loader.ts points the loader at /monaco/vs)
// - Blockly's media (sprites, sounds, cursors; block-workspace.tsx `media`)
// The copies are gitignored and regenerated on install, dev and build so they
// always match the installed package versions.
import { cpSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// Not require.resolve: both packages' `exports` hide package.json and these dirs.
const pkgDir = (name) => join(root, "node_modules", name);

const copies = [
  [join(pkgDir("monaco-editor"), "min/vs"), "public/monaco/vs"],
  [join(pkgDir("blockly"), "media"), "public/blockly/media"],
];

for (const [from, to] of copies) {
  const dest = join(root, to);
  rmSync(dest, { recursive: true, force: true });
  cpSync(from, dest, { recursive: true });
  console.log(`copied ${from} -> ${to}`);
}
