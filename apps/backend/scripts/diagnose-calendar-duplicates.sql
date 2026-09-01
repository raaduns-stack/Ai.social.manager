-- ============================================================================
-- DIAGNOSTIC: Find duplicate calendar posts caused by the old idempotency bug
-- ============================================================================
-- Run this query against the production database to identify duplicate records.
-- One logical generated post should map to ONE content_calendar record.
-- The old bug could insert the same logical post multiple times when n8n
-- retried the callback before the first attempt's status update committed.
--
-- HOW TO READ RESULTS:
--   - If `duplicate_count` = 1 for a user/month, no duplicates exist.
--   - If `duplicate_count` > 1, the same title+platform+month was inserted
--     more than once. Review and manually delete the extras.
--
-- IMPORTANT: This query does NOT delete anything. It only reports.
-- ============================================================================

SELECT
  cc.user_id,
  u.full_name,
  u.email,
  cc.month AS scheduled_month,
  cc.title,
  cc.platform,
  cc.scheduled_at,
  cc.ai_generated,
  cc.created_at,
  cc.id AS post_id,
  COUNT(*) OVER (
    PARTITION BY cc.user_id, cc.month, cc.title, cc.platform
  ) AS duplicate_count
FROM content_calendar cc
JOIN users u ON u.id = cc.user_id
WHERE cc.ai_generated = true
ORDER BY
  cc.user_id,
  cc.month,
  cc.title,
  cc.platform,
  cc.created_at;

-- ============================================================================
-- SUMMARY: Count of duplicates per user/month
-- ============================================================================

SELECT
  cc.user_id,
  u.full_name,
  cc.month AS scheduled_month,
  cc.title,
  cc.platform,
  COUNT(*) AS post_count,
  CASE
    WHEN COUNT(*) = 1 THEN 'OK - single record'
    ELSE 'DUPLICATE - ' || COUNT(*) || ' records found'
  END AS status
FROM content_calendar cc
JOIN users u ON u.id = cc.user_id
WHERE cc.ai_generated = true
GROUP BY cc.user_id, u.full_name, cc.month, cc.title, cc.platform
HAVING COUNT(*) > 1
ORDER BY post_count DESC;
