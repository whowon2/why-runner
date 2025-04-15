import { mkdir, stat, writeFile } from "node:fs/promises";

export class FileLogger {
	private file: string;

	constructor(private readonly context: string) {
		this.file = `logs/${this.context || "default"}.txt`;
	}

	private getTime() {
		return new Date().toLocaleTimeString();
	}

	async log(layer: string, message: string) {
		await writeFile(this.file, `${this.getTime()}: ${layer}: ${message}\n`, {
			flag: "a",
		});
	}

	async error(layer: string, message: string) {
		await writeFile(this.file, `${this.getTime()}: ${layer}: ${message}\n`, {
			flag: "a",
		});
	}
}
