# Designer Portal: From Mock UI to Wired End-to-End — Build Report

> **Scope:** Designer Portal (`/designer/*`) of RaaSocial (Kleos) — AI-driven social media management platform
> **Period covered:** UI flow + frontend mockups complete → backend module built → frontend wired → live end-to-end on an isolated database branch
> **Author:** *(presenter — add your name)*
> **Date:** 7 September 2026
> **Status:** All planned phases complete and verified. Shared production database untouched throughout.

---

## 1. Executive summary

When this phase of work began, the Designer Portal was a **finished-looking product with no engine**: seven polished pages running entirely on hardcoded mock data, with no backend module, no database tables, and no API wiring. Over four phases I:

1. **Built the backend** — 10 database tables, a NestJS `DesignerModule` with **23 routes**, 8 validated DTOs, role-guarded access.
2. **Versioned the database change** — a reviewed `0018` migration plus a dev-only seed script.
3. **Wired the frontend** — a new `features/designer/` API layer; all 7 pages plus upload and code modals fetch, mutate, upload, and persist against the real API. Zero mocks remain.
4. **Proved it live** — migrated and seeded an isolated Neon database branch (`designer test`) and passed an **18/18 end-to-end API suite**, then logged into the real UI against live data.

Net result: the portal went from "clickable prototype" to "working product on real infrastructure," with a repeatable path to production that touches the shared database exactly once (a single additive migration).

---

## 2. Starting point — what existed before

| Area | State |
|---|---|
| Designer UI (7 pages + modals) | ✅ Complete and polished — dashboard, tasks, submissions, payments, settings, notifications, image-to-code, upload modal |
| Data | ❌ 100% hardcoded mocks (`mockTasks`, `mockPayouts`, `mockConversions`, …) plus hardcoded `₦` strings in JSX |
| Backend designer module | ❌ Did not exist (`apps/backend/src/designer/` absent) |
| Database tables | ❌ No tasks, submissions, payouts, notifications, or profile tables |
| API wiring | ❌ Zero — upload buttons ran `setTimeout` simulations; drafts/read-flags lived in `localStorage` |
| Auth | ✅ Designer login/register existed via shared `/auth/*`; only designer-role accounts admitted |
| Customer portal / Admin panel | ✅ Working; explicitly out of scope and left untouched |

The honest one-line assessment I gave the project at the time: *a finished-looking product with no engine.*

---

## 3. Phase 1 — Backend: schemas + DesignerModule (Task 4)

### 3.1 Database schemas — 10 tables, 7 enums (6 new files)

| Table | Purpose | Notable design calls |
|---|---|---|
| `designer_profiles` | Bio, portfolio URL, specialties | Name/email/phone/avatar stay in `users` — deliberately **not duplicated** |
| `tasks` | Assigned briefs (priority, due date, open/in_progress/done) | `assigned_by` set-null so history survives staff deletion |
| `submissions` | Design uploads through the 8-step lifecycle | `category` is **free-text varchar, not an enum** — the UI lets designers create custom categories, an enum would have rejected them |
| `submission_files` | File rows (`/uploads/…` URLs, MIME, size) | Cascade-delete with the submission |
| `submission_activities` | Audit trail (created/submitted/approved/…) | Powers the activity filter on the Submissions page |
| `designer_payments` | Payout records | `amount` is **integer kobo**, matching the existing `payments` convention |
| `designer_payment_methods` | Bank name/number/account name | Bank-transfer only, per product decision |
| `designer_notifications` | Inbox feed with read flags | — |
| `designer_notification_preferences` | Per-category toggles + digest | Dedicated table (the generic platform notification system had no digest concept and is admin-managed) |
| `image_to_code` | Code drafts per approved submission | `submission_id` **unique** — one conversion per design |

Enums: `task_priority`, `task_status`, `submission_status` (full 8-step lifecycle), `payout_status`, `designer_notification_type`, `digest_frequency`, `image_to_code_status`.

### 3.2 `DesignerModule` — 23 routes, one controller, one service

- **Controller** (`designer.controller.ts`): all routes under `/api/designer/*`, guarded class-wide by `JwtAuthGuard + RolesGuard` with `@Roles('designer')`, Swagger-annotated, multipart upload on `POST /submissions` (max 5 files). Route groups: dashboard summary · profile GET/PUT · tasks GET + status PATCH · submissions CRUD + submit + activity · payments history + method CRUD · notifications feed + read + preferences · password change · image-to-code drafts + submit.
- **Service** (`designer.service.ts`, 24 methods): every query scoped to the caller's ID with ownership checks; dashboard summary computed from 7 parallel queries (totals, approval rate, status counts, recents with progress %, revision attention, deadlines, paid/pending sums, 6-month earnings series); password change via bcrypt (same 10 rounds as auth); a `createNotification()` helper exported for the future admin review flow.
- **8 DTOs** with strict validation (the global pipe rejects unknown fields, so shapes are exact).
- **Module wiring** mirrors the proven `KycModule`: shared `uploads/` disk storage, `fieldname-timestamp-random` naming, image+PDF filter, 10 MB cap; registered in `AppModule`.

### 3.3 Rules the backend enforces (not just data)

- Designers create drafts and read status; **review transitions live in the admin panel** — approved/completed submissions and accepted/submitted code are locked against edits (403).
- Profile email is read-only (verification implications); avatar persists as a URL.
- Profile and preference rows auto-create with defaults so fresh accounts never 404.

---

## 4. Phase 2 — Migration + seed (Task 5)

- **`0018_mean_gateway.sql`** generated via `db:generate`, reviewed line-by-line: 7 `CREATE TYPE`s, 10 `CREATE TABLE`s, 14 foreign keys — then **deliberately not applied** to the shared database.
- Along the way I caught and fixed my own wart *before* anything consumed it: `is_default` first generated as `varchar(3) DEFAULT 'yes'`; corrected to `boolean DEFAULT true` and regenerated cleanly.
- **`seed-designer-demo.ts`** (dev-only, manual invocation, never on boot): demo designer + 3 tasks, 5 submissions across lifecycle states, 3 payouts, payment method, 5 notifications, 1 code draft. Idempotent, scoped to the demo email. *Post-session update: the script file was removed from the repo after use; the seeded rows remain on the `designer test` branch for demo purposes.*

---

## 5. Phase 3 — Frontend wiring (Task 3)

### 5.1 New API layer — `features/designer/`

| File | Contents |
|---|---|
| `designer-api.ts` | 20 functions, one per endpoint group (incl. `FormData` multipart upload), same thin-wrapper pattern as the customer portal |
| `designer-types.ts` | Response/payload interfaces |
| `format.ts` | `naira()` (kobo→₦), relative-time and due-date formatting (existing `date-fns` dep), file-URL resolver (`/uploads/…` → API origin), Today/Yesterday/Earlier grouping |

### 5.2 Page-by-page changes

| Page | Before (mock) | After (live) |
|---|---|---|
| Dashboard | 6 mock constants + hardcoded ₦248,000/66%/etc. | Summary endpoint drives cards, donut, 6-month chart, recents, attention, deadlines; header computed from real numbers |
| Tasks | 4 hardcoded tasks | Fetched list + existing filters; null-safe dates, short IDs |
| Submissions | 8 fake submissions + 10 fake activity rows; upload faked with `setTimeout` | Real list + per-submission activity; detail modal shows description, file links, activity trail; submit/resubmit hits the API |
| Upload modal | Simulated submit; allowed ZIP/20 files/50 MB | Real multipart POST; **constraints aligned down to the backend** (5 files, 10 MB, images+PDF); custom categories kept (backend accepts free text) |
| Payments | 4 fake payouts, fake totals/sparkline | History + method CRUD; totals/pending/last-paid and sparkline derived; CSV statement from real rows |
| Settings | Hardcoded profile/prefs; fake "saved" toasts; avatar "saved" that wasn't | Profile GET/PUT (email read-only, **phone field added**, avatar URL persisted, honest preview-only copy); prefs GET/PUT with real `instant/daily/weekly` + email toggle; live password change |
| Notifications | 6 fake items; read flags in `localStorage` | Live feed, server read flags (optimistic with rollback), read-all |
| Image-to-Code | 5 fake conversions; drafts in `localStorage` | Live conversions; draft save + submit via API; **submitted code is read-only**, matching backend locks |

Retired: `designer_conv_rows`, `designer_notif_read`, and the prefs keys. Kept (correctly): view toggles and custom categories, which are pure UI state.

---

## 6. Phase 4 — Live end-to-end on an isolated branch (Task 6)

Principle: **never test migrations against the shared database.** A `designer test` Neon branch was created; all of the following ran against it:

1. Inspected branch: 29 tables, no migration journal → applied the reviewed `0018` SQL statement-by-statement (**31/31 OK, 10/10 tables**).
2. Ran the seed (3 tasks, 5 submissions, 3 payouts, 5 notifications, 1 conversion).
3. Restarted the backend pointed at the branch; restarted the frontend.
4. Ran an 18-check API suite — **18/18 pass**: login (role=designer), summary, profile read/write, tasks read + status move, submissions read + activity + submit, real PNG multipart upload, payments read + method change, notifications read + mark-read + prefs change, code draft save, password change correctly rejecting a wrong password (400-path).
5. Logged into the actual UI (`designer.demo@example.com` / `DesignerDemo123!`) against live data.

---

## 7. Improvements delivered (before → after)

| # | Before | After |
|---|---|---|
| 1 | Pages rendered fake data indistinguishable from real | Every number on screen comes from the database; empty/error states are honest |
| 2 | Uploads pretended to work (`setTimeout`) | Real multipart upload with server-side validation |
| 3 | Drafts/read-flags died with the browser cache | Persisted server-side, visible on any device |
| 4 | Frontend/backend file limits disagreed (ZIP/20/50 MB vs images+PDF/5/10 MB) | Single source of truth: backend constraints, mirrored in UI copy |
| 5 | Submitted code editable after submission | Locked, matching the review workflow |
| 6 | Settings "saved" toasts with no persistence | Every save round-trips; failures surface |
| 7 | Fake social proof ("Top 20%", "₦42k pending") | Removed; all figures computed |
| 8 | No migration story | Reviewed, versioned `0018` + one-command dev seed |

---

## 8. Fixes made

| Symptom | Root cause | Fix |
|---|---|---|
| "Site can't be reached" on localhost | Both dev servers were stopped (nothing on :5173/:4000) — not a code bug | Restarted both; documented the ~3-min backend boot so it isn't mistaken for broken |
| "Connection Error" on login | Backend wasn't running → `ERR_CONNECTION_REFUSED` on every API call | Started backend; verified health + 401-path |
| 401 with correct demo credentials | Backend had been restarted **without** the branch DB override → pointed at shared DB where the demo user doesn't exist | Restarted backend with the branch `DATABASE_URL`; login → 200 |
| `EADDRINUSE :::4000` crash on start | Stale backend still holding the port | Killed the squatter process; documented the find-and-kill recipe |
| `is_default varchar(3)` in generated SQL | My schema wart, caught in review pre-application | Changed to boolean, regenerated migration cleanly |
| Frontend/backend upload limits disagreed | Independent mock-era choices | Aligned frontend to backend (5 files / 10 MB / images+PDF) |
| Submitted image-to-code editable | Modal predated backend locks | Submitted state is now read-only in the modal |

---

## 9. Problems encountered and how they were resolved

1. **Backend boots slowly (~3 min).** Watch-mode compile plus Neon init looks like a hang at 30 seconds. Resolution: process change — verify via port + boot log, never by impatience. (Also the reason "is it broken?" kept recurring.)
2. **The env-override trap.** The branch database is selected by a per-terminal `$env:DATABASE_URL` line. Any backend started without it silently targets the shared DB — valid credentials then 401, which *looks* like an auth bug. Resolution: documented the rule ("same window, env line first, always") and made it step 1 of every boot checklist. A future improvement: a `start:dev:branch` script or `.env.development` so the override isn't oral tradition.
3. **Port collisions (`EADDRINUSE`).** Multiple background servers across sessions. Resolution: kill-and-verify recipe; discipline of one backend window + one frontend window.
4. **No-migration-journal on the branch.** `db:migrate` couldn't run (nothing to track against). Resolution: applied the reviewed SQL file statement-by-statement — deterministic and faithful to what deploys will run.
5. **PowerShell tooling friction** (backtick-mangled inline scripts, `Start-Process` quirks, missing Docker). Resolution: temp-file scripts outside the repo, `cmd /c` launches; no Docker → Neon branch strategy instead of local Postgres.
6. **`tsconfig` lesson.** Removing the (invalid-looking) `"noCheck": true` broke the build — it is load-bearing, and the codebase has latent type errors in files outside my scope. Resolution: reverted immediately; re-tightening is now a tracked future task, not a drive-by fix. Lesson for the team: never "clean up" a flag you haven't proven redundant.
7. **Frontend has no eslint config** (pre-existing) — `npm run lint` cannot run there at all. Noted, untouched; worth a config so Task 3's JSX is linted going forward.

---

## 10. Verification evidence

- Backend `nest build`: ✅ exit 0 · backend eslint: ✅ 0 errors · frontend `vite build`: ✅
- Migration: 31/31 statements applied, 10/10 tables verified present
- E2E suite: **18/18 pass** (login, summary, profile R/W, tasks R+status, submissions R/submit/upload, payments R/W, notifications R/read/prefs, code R/draft, password 400-path)
- Grep audit: zero `mock*` constants, zero hardcoded `₦` figures, zero retired storage keys in the designer workspace
- Shared Neon DB: untouched (all migration/seed/E2E work on `designer test`)

---

## 11. What's next (per project architecture)

**Immediate (unblocks production):**
1. Apply `0018` to the shared database via the normal deploy pipeline (`db:migrate`), then smoke-test.
2. Decide the branch's fate: keep `designer test` as the permanent dev database (recommended) or delete it.

**Backend (already architected for):**
3. Admin review endpoints (approve / request-revision / reviewer notes) — the service exposes `createNotification()` precisely for this; reviewer actions were deliberately scoped out of this phase.
4. Seller-side payout execution (records exist; the money-movement pipeline does not).
5. Image-to-code conversion pipeline (today: UI + draft persistence only).
6. Real-time notifications (today: feed + preferences only).

**Frontend:**
7. Migrate local view-state to the same patterns if the team adopts React Query/Zustand more widely; add the missing frontend eslint config.
8. Re-tighten backend `tsconfig` and clear the latent type errors (`admin.service`, `mailer.service`, interceptor typings).

**Product questions still open** (need owner input, unchanged): exact category hint copy, image-to-code guideline content, payout method coverage beyond bank transfer, submission file policy if it diverges from 5×10 MB.

---

## 12. Suggested 5-minute live demo script

1. **Show the before**: open any page with the backend stopped → honest error state (30 sec).
2. **Log in**: `designer.demo@example.com` / `DesignerDemo123!` → dashboard with real figures (30 sec).
3. **Upload flow**: upload a PNG → appears in Submissions as Draft → Submit for review → status flips (90 sec).
4. **Money + settings**: payments history, change payout method, toggle a notification pref, change nothing about email (60 sec).
5. **Image-to-code**: open a conversion, edit, save draft, submit; show submitted lock (60 sec).
6. **Close**: "shared production DB was never touched — one additive migration ships all of this."

---

## Appendix A — File inventory (new/changed this phase)

| Area | Files |
|---|---|
| Schemas (new) | `designer-profiles`, `tasks`, `submissions`, `designer-payments`, `designer-notifications`, `image-to-code` under `apps/backend/src/database/schema/` + barrel export |
| Migration (new) | `0018_mean_gateway.sql` + snapshot + journal entry |
| Seed (used, then removed) | ~~`apps/backend/src/database/seed-designer-demo.ts`~~ — rows retained on the dev branch |
| Module (new) | `apps/backend/src/designer/` — module, controller (23 routes), service (24 methods), 8 DTOs |
| API layer (new) | `apps/frontend/src/features/designer/` — `designer-api.ts`, `designer-types.ts`, `format.ts` |
| Pages rewired | Dashboard, Tasks, Submissions, Payments, Settings, Notifications, ImageToCode |
| Components rewired | `DesignerUploadModal`, `ImageToCodeModal` |
| Backend micro-additions | `monthlyEarnings` in dashboard summary; `avatar` in profile update |

## Appendix B — Daily command cheat sheet

```powershell
# Terminal A — backend (BRANCH database; env line first, every time)
cd "C:\...\Ai.social.manager"
$env:DATABASE_URL="<designer-test-branch-url>"
npm run start:dev --workspace=apps/backend   # wait ~3 min for "successfully started"

# Terminal B — frontend
npm run dev --workspace=apps/frontend        # http://localhost:5173

# Verify both are up
Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in @(4000, 5173) }

# Free a stuck port (replace 12345 with the OwningProcess id)
Stop-Process -Id 12345 -Force

# Migrate (branch only — never the shared DB without sign-off)
$env:DATABASE_URL="<branch-url>"
npm run db:migrate --workspace=apps/backend
# (The one-off seed script has been removed; re-seeding would need it restored from git history.)
```
