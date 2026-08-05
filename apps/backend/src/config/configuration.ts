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
    mailFrom: process.env.MAIL_FROM ?? 'noreply@socialpilot.ai',
  },

  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },

  support: {
    whatsappNumber: process.env.SUPPORT_WHATSAPP_NUMBER,
  },
});
