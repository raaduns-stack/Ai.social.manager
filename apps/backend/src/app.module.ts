import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
      envFilePath: ['.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100, // basic rate limiting; tighten per-route later (e.g. auth endpoints)
      },
    ]),
    DatabaseModule,
    AuthModule,
    // Next modules to add here as they're built:
    // UsersModule, SubscriptionsModule, ContentCalendarModule, UploadsModule,
    // AiModule (Gemini/OpenClaw integration), NotificationsModule, SupportModule
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
