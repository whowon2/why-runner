import { constants } from 'node:fs';
import { access, rm } from 'node:fs/promises';

export async function removeDir(dir: string) {
	try {
		await access(dir, constants.F_OK);
	} catch {
		return;
	}

	try {
		await rm(`dir*`, { force: true, recursive: true });
	} catch (err) {
		if (err instanceof Error) {
			console.error(`Erro ao remover ${dir}:`, err.message);
		}
	}
}
