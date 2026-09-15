# RaaSocial Tonight — Session Context

> **Local only. Not committed to repo.** Acts as the architecture director for every new OpenCode section opened this session.
>
> This file encapsulates all direction, decisions, architecture rules, and task tracking for tonight's build of the Designer Portal UI, backend, and integration.

---

## 1. Session Identity

- **Purpose:** Complete the Designer Portal UI flow, polish UI to perfection, build the backend module and database schemas, and wire everything together end-to-end.
- **Project:** RaaSocial (Kleos) — AI-driven social media management platform
- **Session focus:** Designer Portal (separate from customer portal)

---

## 2. Project Overview

**RaaSocial** is an AI-driven social media management platform for business clients. It has **two distinct portals**:

| Portal | Path | Audience |
|---|---|---|
| **Customer Portal** | `/dashboard/*` | Business owners (schedule posts, manage channels, AI suggestions, billing) |
| **Designer Portal** | `/designer/*` | Graphic designers (tasks, submissions, activity, payments) |
| **Admin Panel** | `/admin/*` | Staff/admins (user management, KYC, analytics, content moderation) |

**Tech Stack:**
- **Frontend:** React 18 + Vite + Tailwind CSS + Zustand + React Router + Recharts
- **Backend:** NestJS + PostgreSQL (Neon) + Drizzle ORM + Passport JWT + n8n webhooks
- **Payments:** Flutterwave (customer checkout) + seller-side payout (designer earnings)
- **Automation:** n8n webhooks for AI generation and calendar generation
- **Shared Types:** `packages/shared-types/`

**Monorepo Structure:**
```
Ai.social.manager/
├── apps/backend/          # NestJS API (Port 4000)
├── apps/frontend/         # React + Vite SPA (Port 5173)
├── packages/shared-types/ # Shared TypeScript interfaces
├── docs/                  # Architecture guides, theme specs, module map
└── ...
```

---

## 3. Tonight's Goal Hierarchy

> Execute in this order — UI first (with mocks), then polish, then wire to real data.

| # | Task | Status | Description |
|---|---|---|---|
| **1** | Designer Portal UI | ⬜ | Complete any remaining page/section imperfections. Still using mock data. |
| **2** | UI Perfection Pass | ⬜ | Audit and polish across designer portal: design tokens, typography, spacing, badges, buttons, radius, consistency with project spec and industry best practices. |
| **3** | UI Flow Completion | ⬜ | Eliminate mock data. Wire all pages to real API calls via backend endpoints. |
| **4** | Backend Designer Module | ⬜ | NestJS controllers, services, guards, and route definitions for the designer workspace. |
| **5** | Database Schemas | ⬜ | Drizzle schema definitions for tasks, submissions, designer entities, and related tables. |
| **6** | Connect Portals | ⬜ | Wire designer auth, data, and workflows between frontend and backend end-to-end. |

---

## 4. Designer Portal — Architecture

### Route Structure (`apps/frontend/src/routes/DesignerRoutes.jsx`)

```
/designer/register          — Self-service registration
/designer/login             — Login
/designer/verify-email      — Email verification
/designer/activate          — Account activation (org-provided)
/designer/forgot-password   — Forgot password
/designer/reset-password    — Reset password
/designer/                  — Dashboard (protected)
/designer/tasks             — Assigned tasks (protected)
/designer/submissions       — Submission tracking (protected)
/designer/activity          — Activity tracking (protected)
/designer/payments          — Earnings & payment history (protected)
/designer/settings          — Profile, account, notifications, security (protected)
/designer/notifications     — Notifications (protected)
```

**Route guards:** `DesignerAuthProvider` + `RequireDesignerAuth` + `DesignerLayout`

### Auth Flow
- **Self-service registration** via link on the landing page (in scope)
- **Org-invited accounts** exist (admin creates designer account) but **out of scope**
- Standard auth lifecycle: register → verify email → activate → login → forgot/reset password
- Uses `DesignerAuthContext` (`apps/frontend/src/context/DesignerAuthContext.jsx`) + `useDesignerAuth` hook

### Submission Lifecycle
```
Draft → Submitted → Received → Under Review → Revision Required → Resubmitted → Approved → Completed
```
- Reviewer actions (Under Review, Revision Required, Approved) happen in the **Admin Panel** — not the designer portal
- Designer portal: submits → tracks status → receives updates

### Payment Flow
- **Seller-side payout** — completely separate from the customer Flutterwave subscription checkout
- Designers receive earnings from approved work; they do not subscribe or pay
- Features: payment info management, earnings history, payment status tracking, payment method integration

### Image-to-Code Integration
- Runs on an automated system (likely n8n)
- **Tonight's scope: UI layer only** — guidelines, preparation instructions, examples, technical instruction fields
- Not building the conversion pipeline

### Activity Tracking
- **No separate activity calendar** — the calendar feature was a development mistake and should be removed
- Activity tracking is **integrated into the Submissions page** — daily/weekly/monthly history within the submissions workflow

### Submission Categories
| Category | Description |
|---|---|
| General Graphics | Standard graphic design work |
| Hospitality | Hotels, restaurants, events, food, tourism |
| Other | Non-standard categories |

- **Category-specific requirements = UI hints** — contextual guidance/tips shown when a category is selected. Informational only; does not change form fields or validation rules.

### Dashboard Sections
- Assigned tasks overview
- Recent submissions
- Submission status
- Payment summary
- Quick actions (Upload Design, View Tasks, My Submissions, Payments, Profile, Notifications)

---

## 5. Key Decisions & Constraints

1. **Self-service auth only** — Org-invited accounts exist but are out of scope.
2. **Seller-side payments** — Separate from customer Flutterwave flow. Do not reuse subscription checkout logic.
3. **Image-to-code is UI only** — Build the guidelines/instructions/interaction layer. Backend conversion pipeline not built.
4. **No activity calendar** — Remove the standalone calendar feature. Activity lives inside the submissions page.
5. **Category-specific = UI hints** — Contextual guidance shown per category, not different form fields or validation rules.
6. **Reviewer actions in admin panel** — The designer portal does not handle review/approval; it only tracks status.
7. **Existing design token system** — Use `docs/ADMIN_THEME.md` as the design authority: Primary `#4F46E5`, Success `#10B981`, Warning `#F59E0B`, Error `#EF4444`, Surface `#FFFFFF`, Border `#E5E7EB`, Text `#111827`, Radius `rounded-card` (12px) / `rounded-lg` (8px) / `rounded-full`.
8. **Typography** — Inter font, `text-lg font-semibold` for titles, `text-xs font-medium uppercase tracking-wide` for labels, `text-sm` for body, `text-xs text-[#6B7280]` for muted.
9. **Status badges** — Use exact class combos: active/verified/approved → `bg-emerald-100 text-emerald-700`, pending → `bg-amber-100 text-amber-700`, rejected/suspended → `bg-red-100 text-red-700`, disconnected/closed → `bg-gray-100 text-gray-700`.
10. **Buttons** — Primary: `bg-[#4F46E5] text-white px-4 py-2 rounded-lg`, Danger: `bg-[#EF4444]`, Secondary: `border border-[#E5E7EB]`. All `text-sm font-medium`.
11. **Cards** — `rounded-card border border-[#E5E7EB] bg-white p-5`, flat 1px border, no shadow at rest.
12. **Tables** — Every list view goes through `DataTable.jsx`. Header row `text-[#6B7280]`, body rows `border-b border-[#E5E7EB]`.
13. **Icons** — Lucide only, `size={16}` inline, `size={18}-20` standalone.
14. **Spacing** — Page padding `p-6`, card padding `p-5`, vertical rhythm `space-y-6`, inline gap `gap-2`.

---

## 6. Design System Rules (from `docs/ADMIN_THEME.md`)

| Token | Value | Use |
|---|---|---|
| Primary | `#4F46E5` | Buttons, active nav, links, focus rings |
| Success / Accent | `#10B981` | Approved, active, verified states |
| Warning | `#F59E0B` | Pending states |
| Error | `#EF4444` | Rejected, suspended, expired, form errors |
| Background | `#F9FAFB` | Page background |
| Surface | `#FFFFFF` | Cards, sidebar, navbar, table backgrounds |
| Border | `#E5E7EB` | All borders/dividers |
| Text primary | `#111827` | Headings, body |
| Text muted | `#6B7280` | Labels, timestamps, placeholders |

**Components reference:**
- `apps/frontend/src/components/ui/` — Generic UI primitives (buttons, modals, tables, badges, cards, modal)
- `apps/frontend/src/layouts/` — Page shells (AdminLayout, DashboardLayout, AuthLayout, OnboardingLayout, DesignerLayout)
- `apps/frontend/src/components/designer/premium/` — Designer-specific premium components (PremiumCard, CoverImage, StatusDot, SegmentedControl, TimelineStepper, DesignerUploadModal)
- `apps/frontend/tailwind.config.js` — Design tokens, never hardcode hex values

---

## 7. File Map

### Frontend — Designer Portal Pages
| File | Description |
|---|---|
| `apps/frontend/src/routes/DesignerRoutes.jsx` | Route definitions + guard wrapper |
| `apps/frontend/src/pages/Designer/Dashboard.jsx` | Dashboard with stats, recent subs, quick actions |
| `apps/frontend/src/pages/Designer/Tasks.jsx` | Assigned tasks (table + board view) |
| `apps/frontend/src/pages/Designer/Submissions.jsx` | Submission tracking + upload modal + activity |
| `apps/frontend/src/pages/Designer/ImageToCode.jsx` | Image-to-Code page — approved designs → code versions (filters, grid/table, localStorage) |
| `apps/frontend/src/components/designer/ImageToCodeModal.jsx` | Code editor + preview modal with draft/submit/revision/accepted states |
| `apps/frontend/src/pages/Designer/Activity.jsx` | ⚠️ Calendar component — to be removed (activity moves to Submissions) |
| `apps/frontend/src/pages/Designer/Payments.jsx` | Earnings & payment history |
| `apps/frontend/src/pages/Designer/Settings.jsx` | Profile, account, notifications, security |
| `apps/frontend/src/pages/Designer/Notifications.jsx` | Notifications feed |
| `apps/frontend/src/pages/Designer/Auth/DesignerRegister.jsx` | Self-service registration |
| `apps/frontend/src/pages/Designer/Auth/DesignerLogin.jsx` | Login |
| `apps/frontend/src/pages/Designer/Auth/DesignerActivate.jsx` | Account activation |
| `apps/frontend/src/pages/Designer/Auth/DesignerForgotPassword.jsx` | Forgot password |
| `apps/frontend/src/pages/Designer/Auth/DesignerResetPassword.jsx` | Reset password |
| `apps/frontend/src/pages/Designer/Auth/DesignerVerifyEmail.jsx` | Email verification |

### Frontend — Context & Components
| File | Description |
|---|---|
| `apps/frontend/src/context/DesignerAuthContext.jsx` | Designer auth state |
| `apps/frontend/src/context/useDesignerAuth.js` | Designer auth hook |
| `apps/frontend/src/context/RequireDesignerAuth.jsx` | Auth guard |
| `apps/frontend/src/layouts/DesignerLayout.jsx` | Designer page shell |
| `apps/frontend/src/components/designer/` | Designer-specific premium components |

### Frontend — API Features
| File | Description |
|---|---|
| `apps/frontend/src/features/dashboard/dashboard-api.ts` | Customer dashboard API (pattern reference) |
| `apps/frontend/src/features/designer/designer-api.ts` | Designer API client — 20 fns over `/api/designer/*` |
| `apps/frontend/src/features/designer/designer-types.ts` | Designer API response/payload interfaces |
| `apps/frontend/src/features/designer/format.ts` | `naira()`, `timeAgo()`, `formatDue()`, `resolveFileUrl()`, `groupLabel()` |
| `apps/frontend/src/lib/api-client.ts` | Central axios client |

### Backend — Existing Modules (reference for new designer module)
| File/Directory | Description |
|---|---|
| `apps/backend/src/auth/` | Auth controllers, services, guards, strategies |
| `apps/backend/src/database/schema/` | Drizzle schema definitions |
| `apps/backend/src/database/schema/index.ts` | Schema barrel export |
| `apps/backend/src/app.module.ts` | Module registration |
| `apps/backend/src/common/enums/roles.enum.ts` | Role definitions (super_admin, account_manager, reviewer, designer, client) |
| `apps/backend/src/database/` | DB connection, migrations, seed scripts |

### Backend — Designer Module (built)
| File/Directory | Description |
|---|---|
| `apps/backend/src/designer/designer.module.ts` | Designer module wiring + Multer upload config |
| `apps/backend/src/designer/designer.controller.ts` | `DesignerController` — `/api/designer/*`, 23 routes, `@Roles(designer)` |
| `apps/backend/src/designer/designer.service.ts` | Designer workspace business logic (profiles, tasks, submissions, payouts, notifications, image-to-code, password) |
| `apps/backend/src/designer/dto/` | 8 validation DTOs |
| `apps/backend/src/database/schema/designer-profiles.schema.ts` | `designer_profiles` table |
| `apps/backend/src/database/schema/tasks.schema.ts` | `tasks` table |
| `apps/backend/src/database/schema/submissions.schema.ts` | `submissions` + `submission_files` + `submission_activities` tables |
| `apps/backend/src/database/schema/designer-payments.schema.ts` | `designer_payments` + `designer_payment_methods` tables |
| `apps/backend/src/database/schema/designer-notifications.schema.ts` | `designer_notifications` + `designer_notification_preferences` tables |
| `apps/backend/src/database/schema/image-to-code.schema.ts` | `image_to_code` table |

### Backend — Migrations & Seeds (Task 5)
| File/Directory | Description |
|---|---|
| `apps/backend/src/database/migrations/0018_mean_gateway.sql` (+ snapshot + journal) | Designer migration: 7 enums, 10 tables, 14 FKs. Generated, reviewed, **not applied** — deploys apply via `db:migrate` |
| ~~`apps/backend/src/database/seed-designer-demo.ts`~~ | Dev-only demo seed — used once against the `designer test` branch, then removed (rows remain on the branch) |

### Documentation
| File | Description |
|---|---|
| `docs/DESIGNER_PORTAL_FEATURES.md` | Full feature list and requirements |
| `docs/ADMIN_THEME.md` | Design system tokens and rules |
| `docs/MODULE_MAP.md` | Module-to-file lookup |
| `docs/GIT_WORKFLOW.md` | Branching and commit conventions |

---

## 8. Out of Scope for Tonight

- Org-invited designer account creation (admin creates designer)
- Payment payout backend pipeline (seller-side integration)
- Image-to-code conversion pipeline (n8n/AI backend)
- Reviewer/approval actions (admin panel only)
- Real-time notifications backend
- Customer portal changes
- Admin panel changes
- Any database migration scripts that affect customer data

---

## 9. Progress Tracker

| # | Task | Status | Notes |
|---|---|---|---|
| **1** | Designer Portal UI — Complete remaining page/section imperfections | ✅ Done | Added full quick-actions row (all 6), removed dead buttons, fixed upload status mismatch (now Submitted), removed Image-to-Code as 4th category + category-driven fields/validation (hints only), added functional cover/avatar uploads, business name + specialties profile fields, password validation, notifications read persistence, TimelineStepper now covers full lifecycle incl. `received`, **new standalone Image-to-Code page module** (`/designer/image-to-code` — approved designs list + code-editor modal with sandboxed preview, draft/submit/revision/accepted states, localStorage persistence). Upload modal: removed image-to-code panel (moved to its own page), upload-field audit fixes (maxLength, file-type validation, labels, toasts), **searchable category combobox with inline create** (new `CategoryCombobox` premium component — ARIA combobox, `+ Create "…"` pinned top on no-exact-match, dedupe, localStorage persist). Submissions page: activity filter replaces status filter, Day/Week/Month date filter now actually filters the grid by `updatedAt` (was display-only — fixed), period-aware chip counts, mock dates are now relative to `now`. Build passes. |
| **2** | UI Perfection Pass — Polish to highest standard | ✅ Done | Full audit of all designer pages/components. **Brand decision: KEEP orange `#FF6600`** — it is the designer portal's deliberate isolated premium identity (own `designer-premium.css`, Plus Jakarta Sans display + JetBrains Mono labels), coexisting intentionally with the admin indigo `#4F46E5`. Shared system tokens (ink/canvas/border/surface/radii/badges/buttons) already match ADMIN_THEME spec. Fixes applied: PageHeader premium variant now uses tokens (`text-primary`/`text-ink`/`text-ink-muted`) instead of hardcoded hex; Dashboard earnings chart now uses `var(--dp-primary)` instead of hardcoded `#FF6600`; ImageToCodeModal copy `"· 10 min"` → `"· min 10 chars"`. Changes verified clean (token scope confirmed inside `.designer-premium`, no visual/behavioral regression). Build passes. Data-viz series colors in Tasks board / Payments chart left as-is (intentional data colors). |
| **3** | UI Flow Completion — Wire to real APIs | ✅ Done | New `features/designer/` layer (`designer-api.ts` 20 fns, `designer-types.ts`, `format.ts` kobo→₦/relative-time/file-URL). All 7 pages fetch with loading/error/empty states, zero mocks/hardcoded-₦ left (grep-verified). Upload modal posts real multipart (constraints aligned to backend: 5 files, 10MB, images+PDF); detail modals show real files/activity/descriptions; submit/resubmit + image-to-code draft/submit wired; notif read + prefs + password change live; retired `designer_conv_rows`/`designer_notif_read` (view/category keys kept). Backend micro-additions: `monthlyEarnings` in dashboard summary, `avatar` in profile PUT. Submitted image-to-code now read-only (matches backend locks). Frontend `vite build` passes; frontend eslint has no config (pre-existing). Live run blocked on migrate+seed (Task 6). |
| **4** | Backend Designer Module — NestJS controllers/services/guards | ✅ Done | Created `apps/backend/src/designer/` — single `DesignerController` (`/api/designer/*`, 22 routes) guarded `@Roles(designer)`, `DesignerService` (profiles, tasks, submissions + multipart upload + activity, payouts + method, notifications + prefs, image-to-code drafts, password change via bcrypt), 8 DTOs, `DesignerModule` with Multer disk storage (reuses shared `uploads/`, image+PDF, 10MB). Registered in `app.module.ts`. Also created the 6 Drizzle schema files it depends on (see Task 5 note). tsc build + eslint clean. |
| **5** | Database Schemas — Drizzle schemas for designer entities | ✅ Done | Schema files (6) under `database/schema/` + barrel export (see Backend map). Migration `0018_mean_gateway.sql` (+ snapshot + journal) generated via `db:generate`: 7 enums, 10 tables, 14 FKs — reviewed, committed, **not applied** (shared Neon DB; deploys apply via `db:migrate`). Dev-only seed script `src/database/seed-designer-demo.ts` was used once against the dev branch (demo designer + sample rows) and has since been removed from the repo; branch rows retained for demo purposes. Boot `seeding.ts` untouched (designer role-permissions already covered). tsc build + eslint clean. |
| **6** | Connect Portals — End-to-end integration | ✅ Done (dev branch) | Ran against Neon branch `designer test` (never shared DB): branch had 29 tables, no drizzle journal → applied reviewed `0018_mean_gateway.sql` statement-by-statement (31/31 OK, 10/10 tables), ran `seed-designer-demo.ts` (3 tasks, 5 submissions, 3 payouts, 5 notifs, 1 conversion). Backend restarted on branch; **18/18 E2E API checks pass** (login, summary, profile R/W, tasks R+status, submissions R/submit/multipart-upload, payments R/W method, notifs R/read/prefs, image-to-code R/draft-save, password-change 400-path). Frontend :5173 + backend :4000 both running. Shared Neon DB untouched. |

**Update this tracker as work progresses. Mark tasks complete when verified.**

---

## 10. Open Questions

- **Category-specific UI hints:** What exact guidance text/hints should display for each category? (General Graphics, Hospitality, Other) — needs content definition.
- **Image-to-code instructions content:** What specific preparation guidelines and examples should be shown in the UI? — needs content definition.
- **Designer profile fields:** What exact professional profile fields are needed? (Name, business name, portfolio, specialties, etc.)
- **Payment method integration:** What payment methods does the seller-side payout support? (Bank account, PayPal, etc.)
- **Submission file requirements:** How many files per submission? What formats? What size limits?
- **Activity tracking granularity:** What specific activity data is tracked? (Uploads, submissions, status changes) — needs schema definition.
- **Notification types:** What specific notifications does a designer receive? (Task assigned, submission received, review complete, payment processed)
- **Notification source:** Are designer notifications pushed from admin actions, or are they a separate system?

> Note: For items marked "needs content definition," these may require input to proceed. For items that are schema/data questions, these will be resolved during database schema creation (Task #5).

---

## 11. Designer Portal Completion — Phase 7 (in progress, branch `designer-auth`)

Outstanding-issues audit produced 6 Critical / 9 High / 12 Medium / 6 Low items. Execution: sequential tracks A → B → C, each closed by an orchestrator gate (builds + grep audits + scope check). Migrations `0019`+`0020` are branch-only; shared DB untouched.

| Track | Scope | Status | Notes |
|---|---|---|---|
| **A** | Backend auth: `forgot/reset-password`, invitations system + `designer/activate`, wire 3 frontend pages | ✅ Gate passed | `0019` reset cols, `0020` `designer_invitations`, 4 DTOs, 2 mailer methods, 4 service methods, 4 routes. `nest` + `vite` builds green. Live E2E deferred (no branch DB URL this session). |
| **B** | Shell: Navbar/Sidebar live data, auth loading, error boundary | ⏭️ Skipped per instruction | Deferred — focus on Track C page polish (2026-09-08). Uncommitted shell diff remains in worktree untouched. |
| **C** | Pages: real avatar/cover uploads, copy fixes, page UX gaps | ✅ Done (2026-09-08) | **Settings:** `Settings.jsx:27-148` real avatar/cover via `uploadDesignerAvatar/Cover` (5MB image-only, remove, `resolveFileUrl`, `patchSession`), 160-char bio limit, dynamic completeness tip. **Submissions:** `Submissions.jsx:5-167` + new `SubmissionSearch.jsx:1` (4-sugg, keyboard nav, clear), `taskId` deep-link auto-opens `DesignerUploadModal`, gallery preview + loading/error/coverFileUrl, PDF fallback. **Tasks:** `Tasks.jsx:30-41` `handleStartSubmission` PATCHes to `in_progress` then `navigate(?taskId=)` (table+board). **Cover:** `CoverImage.jsx:14-27` onError→gradient fallback, `resolveFileUrl` wired in Submissions/ImageToCode. **Payments:** `Payments.jsx:273-317` copy decoupled from Flutterwave (3 spots). **CategoryCombobox:** `CategoryCombobox.jsx:169-195` `Create→Suggest`. **ImageToCode:** `ImageToCodeModal.jsx:129` 80vw/80vh, `ImageToCode.jsx:14` coverFileUrl, dark `bg-ink` editor, browser chrome, taller preview. **Dashboard:** `Dashboard.jsx:53` `Good ${dayPart}`. Backend: `designer-profiles.schema.ts:16` + `0025_designer_cover_image.sql:5`, `designer.controller.ts:65` avatar/cover routes, `designer.service.ts:316-378` validate 5MB image, `coverFileUrl` enrichment + idempotent mint. `vite` 2976 modules + `tsc` exit 0 verified. `M` flags are LF→CRLF only except designer page files above. |

**Prod DB apply (2026-09-08, done):** `0018`+`0019`+`0020` applied to Neon production via `db:push --force` (plain `db:push` aborts without TTY — also affects `deploy.yml:36` on headless SSH). Verified post-apply: 11/11 designer tables, 7/7 enums, 2/2 `users` reset cols, 15/15 designer FKs, `users_count` unchanged (=1, no data touched). Incidental adds in same diff: `publishing_logs` FK rename (same target, name truncated per Postgres NOTICE) + 2 `activity_logs` indexes. Safety: backup branch `pre-designer-2026-09-08` forked from prod pre-apply; staging rehearsal skipped per explicit instruction. Old-file `M` flags in worktree are LF→CRLF only (zero diff). API smoke deferred (backend not running; no designer user seeded on prod — out of scope).

**Prod follow-up fix (2026-09-08, done):** designer login 500'd (`Failed query` on users SELECT) because prod lacked `users.deleted_at` — upstream's `0018_conscious_katie_power.sql:7` adds it, but our earlier `db:push --force` ran from a schema without it. Applied surgically (`ADD COLUMN deleted_at timestamp`, nullable, users_count still 1). Login path verified live: wrong-password attempt now returns 401 (query executes) instead of 500. **Deferred, needs owner decision:** merged schema wants a `role_module_unique` constraint on `role_permissions` (75 rows) — `db:push` demands a truncate decision for it, so it was deliberately NOT force-pushed. Do not run `--force` until duplicates are reviewed.
