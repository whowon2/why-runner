import { Injectable, type OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@runner/db";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
	async onModuleInit() {
		await this.$connect();
	}
}
