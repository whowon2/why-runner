import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import * as Joi from "joi";
import { AppController } from "./app.controller";
import { ProblemsModule } from "./problems/problems.module";
import { DatabaseModule } from "./database/database.module";
import { SubmissionsModule } from './submissions/submissions.module';

const envSchema = Joi.object({
	NODE_ENV: Joi.string()
		.valid("development", "production")
		.default("development"),
	PORT: Joi.number().default(4000),
	DATABASE_URL: Joi.string().required(),
});

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			validationSchema: envSchema,
		}),
		ProblemsModule,
		DatabaseModule,
		SubmissionsModule,
	],
	controllers: [AppController],
	providers: [],
})
export class AppModule {}
