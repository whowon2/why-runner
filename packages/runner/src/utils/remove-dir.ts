import { constants } from 'node:fs';
import { access, rm } from 'node:fs/promises';
import { logger } from './logger';

export async function removeDir(dir: string) {
	logger.info(`Removing directory ${dir}`);
	try {
		await access(dir, constants.F_OK);
	} catch {
		return;
	}

	try {
		await rm(dir, { force: true, recursive: true });
	} catch (err) {
		if (err instanceof Error) {
			console.error(`Erro ao remover ${dir}:`, err.message);
		}
	}
}
