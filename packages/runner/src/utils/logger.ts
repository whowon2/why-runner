const useJson = process.env.NODE_ENV === 'production'; // plain text in dev, JSON in prod

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const colors: Record<LogLevel, string> = {
	info: '\x1b[36m', // cyan
	warn: '\x1b[33m', // yellow
	error: '\x1b[31m', // red
	debug: '\x1b[35m', // magenta
};

function log(level: LogLevel, message: string, meta?: unknown) {
	const timestamp = new Date().toISOString();

	if (useJson) {
		console.log(
			JSON.stringify({
				level,
				timestamp,
				message,
				...(meta ? { meta } : {}),
			}),
		);
	} else {
		const color = colors[level];
		const reset = '\x1b[0m';
		const prettyMeta = meta ? `\n  ↳ ${JSON.stringify(meta, null, 2)}` : '';
		console.log(
			`${color}[${level.toUpperCase()}]${reset} ${timestamp} - ${message}${prettyMeta}`,
		);
	}
}

export const logger = {
	info: (msg: string, meta?: unknown) => log('info', msg, meta),
	warn: (msg: string, meta?: unknown) => log('warn', msg, meta),
	error: (msg: string, meta?: unknown) => log('error', msg, meta),
	debug: (msg: string, meta?: unknown) => log('debug', msg, meta),
};
