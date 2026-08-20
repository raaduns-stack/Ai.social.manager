const postgres = require('postgres');
require('dotenv').config({ path: './.env' });

(async () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is not defined in .env file!');
    process.exit(1);
  }

  const sql = postgres(dbUrl, { ssl: 'require' });

  try {
    console.log('Cleaning up duplicate variation_id values in scheduled_posts table...');
    
    // Delete duplicate variation_id rows in scheduled_posts, keeping only the one with the maximum scheduled_post_id
    const deletedCount = await sql`
      DELETE FROM scheduled_posts a
      USING scheduled_posts b
      WHERE a.scheduled_post_id < b.scheduled_post_id
        AND a.variation_id = b.variation_id
      RETURNING a.scheduled_post_id;
    `;
    console.log(`Successfully deleted ${deletedCount.length} duplicate scheduled_posts rows.`);

    console.log('Cleanup completed successfully!');
  } catch (err) {
    console.error('Failed to clean up duplicates:', err);
  } finally {
    await sql.end();
  }
})();
