export default () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  frontendUrl: process.env.FRONTEND_URL ?? process.env.CORS_ORIGIN ?? 'http://localhost:5173',

  database: {
    url: process.env.DATABASE_URL,
  },

  auth: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },

  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY,
    openclawApiKey: process.env.OPENCLAW_API_KEY,
    openclawGatewayUrl: process.env.OPENCLAW_GATEWAY_URL,
  },

  payments: {
    flutterwaveSecretKey: process.env.FLUTTERWAVE_SECRET_KEY,
    webhookSecretHash: process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH,
  },

  mail: {
    resendApiKey: process.env.RESEND_API_KEY,
    mailFrom: process.env.MAIL_FROM ?? 'noreply@raasocial.io',
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
    smtpSecure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === undefined ? true : false,
    smtpUsername: process.env.SMTP_USERNAME,
    smtpPassword: process.env.SMTP_PASSWORD,
    senderName: process.env.SMTP_SENDER_NAME ?? 'RaaSocial',
    senderEmail: process.env.SMTP_SENDER_EMAIL ?? process.env.MAIL_FROM ?? 'noreply@raasocial.io',
  },

  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },

  // Support configuration
  // The WhatsApp number is used to generate the premium support link
  support: {
    whatsappNumber: process.env.SUPPORT_WHATSAPP_NUMBER,
  },

  n8n: {
    webhookUrl: process.env.N8N_CALENDAR_GENERATION_WEBHOOK_URL,
    internalApiKey: process.env.N8N_INTERNAL_API_KEY,
  },
});
