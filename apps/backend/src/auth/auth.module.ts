import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { TumblrStrategy } from './strategies/tumblr.strategy';
import { MailerModule } from '../mailer/mailer.module';
import { LoginHistoryModule } from '../login-history/login-history.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { SocialAccountsModule } from '../social-accounts/social-accounts.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    MailerModule,
    LoginHistoryModule,
    ActivityLogsModule,
    SocialAccountsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, TumblrStrategy],
  exports: [AuthService],
})
export class AuthModule {}

