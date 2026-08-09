import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, unique } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

// 1. company_profile (singleton — only one row will ever exist)
export const companyProfile = pgTable('company_profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  logoUrl: text('logo_url'),
  contactEmail: varchar('contact_email', { length: 255 }).notNull(),
  contactPhone: varchar('contact_phone', { length: 50 }),
  website: varchar('website', { length: 255 }),
  addressLine1: varchar('address_line_1', { length: 255 }),
  addressLine2: varchar('address_line_2', { length: 255 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  country: varchar('country', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  businessDescription: text('business_description'),
  registrationNumber: varchar('registration_number', { length: 100 }),
  taxId: varchar('tax_id', { length: 100 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 2. system_settings (singleton)
export const systemSettings = pgTable('system_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  defaultTimezone: varchar('default_timezone', { length: 100 }).notNull().default('Africa/Lagos'),
  maintenanceMode: boolean('maintenance_mode').notNull().default(false),
  allowNewRegistrations: boolean('allow_new_registrations').notNull().default(true),
  contentApprovalRequired: boolean('content_approval_required').notNull().default(true),
  dateFormat: varchar('date_format', { length: 30 }).notNull().default('DD/MM/YYYY'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 3. notification_type_settings (one row per notification type — global admin config)
export const notificationTypeSettings = pgTable('notification_type_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  notificationType: varchar('notification_type', { length: 60 }).notNull().unique(),
  emailAvailable: boolean('email_available').notNull().default(true),
  inAppAvailable: boolean('in_app_available').notNull().default(true),
  whatsappAvailable: boolean('whatsapp_available').notNull().default(false),
  isEnabledGlobally: boolean('is_enabled_globally').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 4. notification_preferences (per customer user — one row per user per type)
export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  notificationType: varchar('notification_type', { length: 60 }).notNull(),
  emailEnabled: boolean('email_enabled').notNull().default(true),
  inAppEnabled: boolean('in_app_enabled').notNull().default(true),
  whatsappEnabled: boolean('whatsapp_enabled').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  unq: unique('notification_pref_user_type_idx').on(t.userId, t.notificationType),
}));

// 5. email_config (singleton)
export const emailConfig = pgTable('email_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  smtpHost: varchar('smtp_host', { length: 255 }).notNull(),
  smtpPort: integer('smtp_port').notNull().default(587),
  smtpUsername: varchar('smtp_username', { length: 255 }).notNull(),
  smtpPasswordEncrypted: text('smtp_password_encrypted').notNull(),
  smtpSecure: boolean('smtp_secure').notNull().default(true),
  senderName: varchar('sender_name', { length: 255 }).notNull(),
  senderEmail: varchar('sender_email', { length: 255 }).notNull(),
  replyToEmail: varchar('reply_to_email', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 6. social_api_settings (one row per platform)
export const socialApiSettings = pgTable('social_api_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  platform: varchar('platform', { length: 30 }).notNull().unique(),
  clientId: varchar('client_id', { length: 255 }),
  clientSecretEncrypted: text('client_secret_encrypted'),
  redirectUri: text('redirect_uri'),
  isEnabled: boolean('is_enabled').notNull().default(false),
  additionalConfig: jsonb('additional_config'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 7. payment_gateway_settings (singleton for now, gateway column for future-proofing)
export const paymentGatewaySettings = pgTable('payment_gateway_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  gateway: varchar('gateway', { length: 30 }).notNull().default('flutterwave'),
  publicKey: text('public_key'),
  secretKeyEncrypted: text('secret_key_encrypted'),
  webhookSecretEncrypted: text('webhook_secret_encrypted'),
  supportedMethods: jsonb('supported_methods').notNull().default(['card']),
  isLiveMode: boolean('is_live_mode').notNull().default(false),
  isEnabled: boolean('is_enabled').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 8. customer_company_profile (per customer user)
export const customerCompanyProfile = pgTable('customer_company_profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  businessName: varchar('business_name', { length: 255 }).notNull(),
  businessDescription: text('business_description'),
  industry: varchar('industry', { length: 100 }),
  website: varchar('website', { length: 255 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  addressLine1: varchar('address_line_1', { length: 255 }),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Type exports
export type CompanyProfile = typeof companyProfile.$inferSelect;
export type NewCompanyProfile = typeof companyProfile.$inferInsert;

export type SystemSettings = typeof systemSettings.$inferSelect;
export type NewSystemSettings = typeof systemSettings.$inferInsert;

export type NotificationTypeSetting = typeof notificationTypeSettings.$inferSelect;
export type NewNotificationTypeSetting = typeof notificationTypeSettings.$inferInsert;

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference = typeof notificationPreferences.$inferInsert;

export type EmailConfig = typeof emailConfig.$inferSelect;
export type NewEmailConfig = typeof emailConfig.$inferInsert;

export type SocialApiSetting = typeof socialApiSettings.$inferSelect;
export type NewSocialApiSetting = typeof socialApiSettings.$inferInsert;

export type PaymentGatewaySetting = typeof paymentGatewaySettings.$inferSelect;
export type NewPaymentGatewaySetting = typeof paymentGatewaySettings.$inferInsert;

export type CustomerCompanyProfile = typeof customerCompanyProfile.$inferSelect;
export type NewCustomerCompanyProfile = typeof customerCompanyProfile.$inferInsert;
