import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
	@Get()
	healthcheck(): string {
		return "OK";
	}
}
