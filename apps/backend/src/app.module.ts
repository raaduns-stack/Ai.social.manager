import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
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
import { SupportModule } from './support/support.module';
import { FaqsModule } from './faqs/faqs.module';
import { UploadsModule } from './uploads/uploads.module';
import { CompanyProfileModule } from './settings/company-profile/company-profile.module';
import { CustomerProfileModule } from './settings/customer-profile/customer-profile.module';
import { SystemSettingsModule } from './settings/system-settings/system-settings.module';
import { NotificationSettingsModule } from './settings/notification-settings/notification-settings.module';
import { NotificationPreferencesModule } from './settings/notification-preferences/notification-preferences.module';
import { EmailConfigModule } from './settings/email-config/email-config.module';
import { SocialApiSettingsModule } from './settings/social-api-settings/social-api-settings.module';

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
    ScheduleModule.forRoot(),
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
    SupportModule,
    FaqsModule,
    UploadsModule,
    CompanyProfileModule,
    CustomerProfileModule,
    SystemSettingsModule,
    NotificationSettingsModule,
    NotificationPreferencesModule,
    EmailConfigModule,
    SocialApiSettingsModule,
    // Next modules to add here as they're built:
    // UsersModule, ContentCalendarModule, UploadsModule,
    // AiModule (Gemini/OpenClaw integration), NotificationsModule
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule { }
