require('dotenv/config');
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const schema = require('./dist/src/database/schema');
const { eq, and, desc } = require('drizzle-orm');

async function test() {
  const queryClient = postgres(process.env.DATABASE_URL);
  const db = drizzle(queryClient, { schema });

  const userId = '7cbf936d-c110-4af5-8a4c-8c962688ffae';
  console.log('--- Testing Drizzle Queries ---');

  // Test 1: contentCalendar.findMany
  try {
    const posts = await db.query.contentCalendar.findMany({
      where: eq(schema.contentCalendar.userId, userId),
      orderBy: desc(schema.contentCalendar.createdAt),
      with: {
        user: { columns: { fullName: true, businessName: true } },
        suggestions: {
          with: {
            feedback: true,
          },
        },
        selectedSuggestion: true,
      },
    });
    console.log('Calendar posts query success. Count:', posts.length);
  } catch (err) {
    console.error('Calendar posts query FAILED:', err);
  }

  // Test 2: social_accounts.findMany
  try {
    const accounts = await db.query.social_accounts.findMany({
      where: eq(schema.social_accounts.userId, userId),
    });
    console.log('Social accounts query success. Count:', accounts.length);
  } catch (err) {
    console.error('Social accounts query FAILED:', err);
  }

  await queryClient.end();
}

test().catch(console.error);
