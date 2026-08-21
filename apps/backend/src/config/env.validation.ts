import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Length, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  PORT: number;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsNotEmpty()
  @Length(32, 32)
  SETTINGS_ENCRYPTION_KEY: string;

  @IsString()
  @IsOptional()
  FLUTTERWAVE_SECRET_KEY?: string;

  @IsString()
  @IsOptional()
  FLUTTERWAVE_WEBHOOK_SECRET_HASH?: string;

  @IsString()
  @IsOptional()
  RESEND_API_KEY?: string;

  @IsString()
  @IsOptional()
  MAIL_FROM?: string;

  // Expected format: digits only, no leading '+', e.g. 2348000000000
  @IsString()
  @IsOptional()
  SUPPORT_WHATSAPP_NUMBER?: string;

  @IsString()
  @IsOptional()
  SMTP_HOST?: string;

  @IsNumber()
  @IsOptional()
  SMTP_PORT?: number;

  @IsString()
  @IsOptional()
  SMTP_SECURE?: string;

  @IsString()
  @IsOptional()
  SMTP_USERNAME?: string;

  @IsString()
  @IsOptional()
  SMTP_PASSWORD?: string;

  @IsString()
  @IsOptional()
  SMTP_SENDER_NAME?: string;

  @IsString()
  @IsOptional()
  SMTP_SENDER_EMAIL?: string;

  @IsString()
  @IsOptional()
  N8N_CALENDAR_GENERATION_WEBHOOK_URL?: string;

  @IsString()
  @IsOptional()
  N8N_INTERNAL_API_KEY?: string;

  @IsString()
  @IsOptional()
  AI_SUGGESTIONS_N8N_GENERATION_WEBHOOK_URL?: string;

  @IsString()
  @IsOptional()
  AI_SUGGESTIONS_N8N_REVISION_WEBHOOK_URL?: string;

  @IsString()
  @IsOptional()
  N8N_PUBLISHING_WEBHOOK_URL?: string;
}

/**
 * Fails startup fast and loudly if a required env var is missing or malformed,
 * instead of the app booting and breaking later on the first request that needs it.
 */
export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(`Config validation error: ${errors.toString()}`);
  }
  return validatedConfig;
}