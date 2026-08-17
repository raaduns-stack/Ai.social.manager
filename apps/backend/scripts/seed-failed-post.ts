import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as crypto from 'crypto';
import { scheduledPosts } from '../src/database/schema/scheduled-posts.schema';
import { publishingLogs } from '../src/database/schema/publishing-logs.schema';

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
    console.log('--- Seeding FAILED ScheduledPost and Publishing Log ---');

    // Generating required UUIDs
    const scheduledPostId = crypto.randomUUID();
    const calendarPostId = '44444444-4444-4444-4444-444444444444';
    const variationId = '55555555-5555-5555-5555-555555555555';
    const socialAccountId = '66666666-6666-6666-6666-666666666666';

    // 2 hours in the past
    const scheduledAt = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const failedPost = {
      scheduledPostId,
      platform: 'instagram',
      content: 'This is a test scheduled post that failed to publish for testing purposes.',
      socialAccountId,
      calendarPostId,
      variationId,
      scheduledAt,
      status: 'FAILED' as const,
    };

    console.log('1. Inserting failed post record:', failedPost);
    const postResult = await db.insert(scheduledPosts).values(failedPost).returning();

    if (postResult.length > 0) {
      console.log('✅ Inserted ScheduledPost successfully!');
      
      const logEntry = {
        scheduledPostId: postResult[0].scheduledPostId,
        status: 'FAILED' as const,
        error: 'Instagram API Error: Rate limit reached (code 429). Please try again later.',
        attemptedAt: scheduledAt,
      };

      console.log('2. Inserting publishing log entry:', logEntry);
      const logResult = await db.insert(publishingLogs).values(logEntry).returning();

      if (logResult.length > 0) {
        console.log('✅ Inserted Publishing Log successfully!');
        console.log('Post & Log Seed Complete.');
        console.log('Inserted Log Details:', JSON.stringify(logResult[0], null, 2));
      } else {
        console.error('❌ Error: Failed to insert publishing log.');
      }
    } else {
      console.error('❌ Error: Failed to insert scheduled post.');
    }
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await client.end();
  }
}

main();
