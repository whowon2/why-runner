import { rm, access } from "node:fs/promises";
import { constants } from "node:fs";

export async function removeDir(dir: string) {
  try {
    await access(dir, constants.F_OK);
  } catch {
    return;
  }

  try {
    await rm(dir, { recursive: true, force: true });
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Erro ao remover ${dir}:`, err.message);
    }
  }
}
