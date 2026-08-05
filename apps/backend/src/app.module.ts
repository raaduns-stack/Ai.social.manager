import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { MailerModule } from './mailer/mailer.module';
import { PlansModule } from './plans/plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PaymentsModule } from './payments/payments.module';
import { InvoicesModule } from './invoices/invoices.module';
import { AdminModule } from './admin/admin.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthController } from './health/health.controller';
import { SocialAccountsModule } from './social-accounts/social-accounts.module';

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
    MailerModule,
    PlansModule,
    SubscriptionsModule,
    PaymentsModule,
    InvoicesModule,
    AdminModule,
    DashboardModule,
    SocialAccountsModule,
    // Next modules to add here as they're built:
    // UsersModule, ContentCalendarModule, UploadsModule,
    // AiModule (Gemini/OpenClaw integration), NotificationsModule, SupportModule
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule { }
