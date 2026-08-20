# Walkthrough: Database-Backed Admin-Editable Subscription Plans & Admin Dashboard Real Data Wiring

## Summary

Replaced the hardcoded subscription plan system with a fully database-backed, admin-editable architecture. Plan limits, features, descriptions, and pricing are now stored in the `plans` table and read dynamically by both the backend enforcement logic and the frontend display pages.

Additionally, audited and refactored the entire Admin Dashboard, replacing mock/fake data with real database-backed queries, establishing appropriate empty states, and splitting previews cleanly into Free and Paid users.

---

## Changes Made

### 1. Database Schema & Plan System

#### [`plans.schema.ts`](file:///c:/Users/USER/Desktop/VScodes/AI%20Social/Ai.social.manager/apps/backend/src/database/schema/plans.schema.ts)
- Added `description` (`varchar(500)`) column for plan descriptions.
- Added `monthlyPostLimit` (`integer`, default `0`) column for post limit enforcement.
- Changed `features` type to `$type<any>()` for flexibility.

#### [`seeding.ts`](file:///c:/Users/USER/Desktop/VScodes/AI%20Social/Ai.social.manager/apps/backend/src/database/seeding.ts)
- Updated `canonicalPlans` to include descriptions and post limits for all 4 tiers.
- Seeded default AI Prompt Templates (`seedPromptTemplates`) on bootstrap for LinkedIn, Twitter, Facebook, and Instagram.

#### [`calendar.service.ts`](file:///c:/Users/USER/Desktop/VScodes/AI%20Social/Ai.social.manager/apps/backend/src/calendar/calendar.service.ts)
- Enforces monthly post limit dynamically from user's current subscription plan table rows. Falls back to Free Plan limit (8 posts) if no active subscription exists.

---

### 2. Admin Dashboard & Mock Data Elimination

#### [`SocialAccounts.jsx`](file:///c:/Users/USER/Desktop/VScodes/AI%20Social/Ai.social.manager/apps/frontend/src/pages/Admin/SocialAccounts.jsx)
- **Eliminated all mock states** and DEV badges.
- Implemented `useEffect` hook querying real user social accounts (`GET /admin/social-accounts`) and connection activity logs.
- Wired **Disconnect Action** to invoke `POST /admin/social-accounts/:id/disconnect` which flags status as disconnected in the database and records an administrative activity log.

#### [`AuditLogs.jsx`](file:///c:/Users/USER/Desktop/VScodes/AI%20Social/Ai.social.manager/apps/frontend/src/pages/Admin/AuditLogs.jsx)
- Fully wired pagination, log description details, actor information, and category filters directly to `/admin/prompt-management/activity-logs`.

#### [`UserDetail.jsx`](file:///c:/Users/USER/Desktop/VScodes/AI%20Social/Ai.social.manager/apps/frontend/src/pages/Admin/UserDetail.jsx)
- Dynamically fetches user profile, payment records, invoice history, connected social accounts, and activity trail on load via `GET /admin/users/:id`.
- Replaced mock handlers with live API invocations for Suspend User and Delete User.

#### [`AIConfiguration.jsx`](file:///c:/Users/USER/Desktop/VScodes/AI%20Social/Ai.social.manager/apps/frontend/src/pages/Admin/AIConfiguration.jsx)
- Configures default system prompts by querying and patching the `aiPromptTemplates` table entries instead of editing local frontend state.

---

## Verification Results

- Verified that `npm run build:frontend` successfully compiled with **0 errors**.
- Verified NestJS development server compiles cleanly and registers the new social accounts and prompt seeding routines on boot.
