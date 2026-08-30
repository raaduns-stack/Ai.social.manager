const postgres = require('postgres');
require('dotenv').config({ path: './.env' });

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function sync() {
  try {
    console.log('Syncing database schema...');

    // 1. Create account_status enum if not exists
    await sql.unsafe(`
      DO $$ BEGIN
        CREATE TYPE "account_status" AS ENUM (
          'EMAIL_VERIFICATION_PENDING',
          'REGISTRATION_IN_PROGRESS',
          'ACTIVE',
          'SUSPENDED',
          'DELETED'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      ALTER TYPE "account_status" ADD VALUE IF NOT EXISTS 'REGISTRATION_IN_PROGRESS';
      UPDATE users SET account_status = 'REGISTRATION_IN_PROGRESS' WHERE account_status::text = 'EMAIL_VERIFICATION_IN_PROGRESS';
    `);

    // 2. Add missing columns to users table
    await sql.unsafe(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS "phone_number" varchar(50),
        ADD COLUMN IF NOT EXISTS "country" varchar(100),
        ADD COLUMN IF NOT EXISTS "profile_image" varchar(500),
        ADD COLUMN IF NOT EXISTS "account_status" account_status NOT NULL DEFAULT 'EMAIL_VERIFICATION_PENDING',
        ADD COLUMN IF NOT EXISTS "account_manager_id" uuid REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS "registered_at" timestamp NOT NULL DEFAULT now(),
        ADD COLUMN IF NOT EXISTS "email_verified_at" timestamp,
        ADD COLUMN IF NOT EXISTS "first_login_at" timestamp,
        ADD COLUMN IF NOT EXISTS "last_login_at" timestamp,
        ADD COLUMN IF NOT EXISTS "suspended_at" timestamp,
        ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
    `);

    // 3. Add missing columns to kyc table
    await sql.unsafe(`
      ALTER TABLE kyc
        ADD COLUMN IF NOT EXISTS "cert_of_registration_original_name" varchar(255),
        ADD COLUMN IF NOT EXISTS "cert_of_registration_mime_type" varchar(100),
        ADD COLUMN IF NOT EXISTS "cert_of_registration_file_size" integer,
        ADD COLUMN IF NOT EXISTS "cert_of_registration_uploaded_at" timestamp,
        ADD COLUMN IF NOT EXISTS "utility_bill_original_name" varchar(255),
        ADD COLUMN IF NOT EXISTS "utility_bill_mime_type" varchar(100),
        ADD COLUMN IF NOT EXISTS "utility_bill_file_size" integer,
        ADD COLUMN IF NOT EXISTS "utility_bill_uploaded_at" timestamp,
        ADD COLUMN IF NOT EXISTS "owner_id_original_name" varchar(255),
        ADD COLUMN IF NOT EXISTS "owner_id_mime_type" varchar(100),
        ADD COLUMN IF NOT EXISTS "owner_id_file_size" integer,
        ADD COLUMN IF NOT EXISTS "owner_id_uploaded_at" timestamp;
    `);

    console.log('Database schema successfully updated!');
  } catch (err) {
    console.error('Error syncing DB schema:', err);
  } finally {
    await sql.end();
  }
}

sync();
