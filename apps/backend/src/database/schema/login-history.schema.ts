import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  boolean,
  text,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { LoginStatus } from '../../common/enums/login-status.enum';
import { LoginFailureReason } from '../../common/enums/login-failure-reason.enum';

export const loginStatusEnum = pgEnum('login_status', [
  LoginStatus.SUCCESS,
  LoginStatus.FAILURE,
]);

export const loginFailureReasonEnum = pgEnum('login_failure_reason', [
  LoginFailureReason.INVALID_CREDENTIALS,
  LoginFailureReason.ACCOUNT_INACTIVE,
  LoginFailureReason.EMAIL_NOT_VERIFIED,
  LoginFailureReason.TOO_MANY_ATTEMPTS,
  LoginFailureReason.UNKNOWN,
]);

export const loginHistory = pgTable(
  'login_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /**
     * Nullable: failed attempts may not resolve to a known user.
     * onDelete: 'set null' keeps history even if the user account is deleted.
     */
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),

    /** The email address that was submitted during the login attempt. */
    email: varchar('email', { length: 255 }).notNull(),

    status: loginStatusEnum('status').notNull(),

    /** Only populated when status = 'failure'. */
    failureReason: loginFailureReasonEnum('failure_reason'),

    /** Raw IP address of the client. */
    ipAddress: varchar('ip_address', { length: 45 }),

    // Geolocation fields (populated if a GeoIP provider is configured)
    country: varchar('country', { length: 100 }),
    city: varchar('city', { length: 100 }),
    region: varchar('region', { length: 100 }),

    // Parsed User-Agent fields
    userAgentRaw: text('user_agent_raw'),
    browser: varchar('browser', { length: 100 }),
    os: varchar('os', { length: 100 }),
    device: varchar('device', { length: 50 }),

    /** True when this attempt is flagged as suspicious. */
    isSuspicious: boolean('is_suspicious').notNull().default(false),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('login_history_user_id_idx').on(table.userId),
    index('login_history_email_idx').on(table.email),
    index('login_history_status_idx').on(table.status),
    index('login_history_created_at_idx').on(table.createdAt),
    index('login_history_ip_address_idx').on(table.ipAddress),
  ],
);

export type LoginHistoryRecord = typeof loginHistory.$inferSelect;
export type NewLoginHistoryRecord = typeof loginHistory.$inferInsert;
