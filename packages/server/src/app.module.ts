import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { validateEnvs } from "./env";
import { ProblemsModule } from "./problems/problems.module";
import { SubmissionsModule } from "./submissions/submissions.module";
import { UserModule } from "./user/user.module";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			validate: validateEnvs,
		}),
		ProblemsModule,
		SubmissionsModule,
		UserModule,
		AuthModule,
	],
	controllers: [AppController],
	providers: [],
})
export class AppModule {}
