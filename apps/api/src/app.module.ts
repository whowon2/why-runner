import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProblemsModule } from './problems/problems.module';

@Module({
	imports: [ProblemsModule],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
