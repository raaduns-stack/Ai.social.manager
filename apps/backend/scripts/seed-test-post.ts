import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as crypto from 'crypto';
import { scheduledPosts } from '../src/database/schema/scheduled-posts.schema';

// Resolve path to backend .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ Error: DATABASE_URL is missing in environment variables');
  process.exit(1);
}

// Initialize Postgres client with SSL enabled
const client = postgres(dbUrl, { ssl: 'require' });

// Initialize Drizzle DB
const db = drizzle(client);

async function main() {
  try {
    console.log('--- Seeding Single Test ScheduledPost ---');

    // Generating required UUIDs
    const scheduledPostId = crypto.randomUUID();
    const calendarPostId = '11111111-1111-1111-1111-111111111111';
    const variationId = '22222222-2222-2222-2222-222222222222';
    const socialAccountId = '33333333-3333-3333-3333-333333333333';

    // Exactly 1 hour in the past
    const scheduledAt = new Date(Date.now() - 60 * 60 * 1000);

    const newPost = {
      scheduledPostId,
      platform: 'twitter',
      content: 'This is a test scheduled post seeded for the n8n pipeline testing.',
      socialAccountId,
      calendarPostId,
      variationId,
      scheduledAt,
      status: 'SCHEDULED' as const,
    };

    console.log('Inserting record:', newPost);

    const result = await db.insert(scheduledPosts).values(newPost).returning();

    if (result.length > 0) {
      console.log('✅ Inserted ScheduledPost successfully!');
      console.log('Inserted Row Details:', JSON.stringify(result[0], null, 2));
    } else {
      console.error('❌ Error: Failed to insert row.');
    }
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await client.end();
  }
}

main();
