# Designer Module (Backend)

NestJS API for the **Designer Portal** (`/designer/*` frontend). Everything a graphic designer does — profile, tasks, submissions, payouts, notifications, image-to-code drafts, password — goes through the routes in this folder under `/api/designer/*`.

> Companion doc: `apps/frontend/src/pages/Designer/README.md` (the UI side).

---

## 1. Folder map

```
apps/backend/src/designer/
├── README.md                  ← you are here
├── designer.module.ts         ← module wiring + file-upload config
├── designer.controller.ts     ← all routes (thin, no business logic)
├── designer.service.ts        ← all business logic (owns every DB query)
└── dto/                       ← validated request shapes (8 files)
    ├── update-profile.dto.ts
    ├── create-submission.dto.ts
    ├── update-submission.dto.ts
    ├── update-task-status.dto.ts
    ├── update-payment-method.dto.ts
    ├── update-notification-prefs.dto.ts
    ├── update-image-to-code.dto.ts
    └── change-password.dto.ts
```

Database tables live separately in `apps/backend/src/database/schema/`:

| Schema file | Tables |
|---|---|
| `designer-profiles.schema.ts` | `designer_profiles` |
| `tasks.schema.ts` | `tasks` |
| `submissions.schema.ts` | `submissions`, `submission_files`, `submission_activities` |
| `designer-payments.schema.ts` | `designer_payments`, `designer_payment_methods` |
| `designer-notifications.schema.ts` | `designer_notifications`, `designer_notification_preferences` |
| `image-to-code.schema.ts` | `image_to_code` |
| `designer-invitations.schema.ts` | `designer_invitations` |

All are re-exported from `database/schema/index.ts`.

---

## 2. Routes (all under `/api/designer`, designer role only)

The controller is guarded class-wide: `JwtAuthGuard + RolesGuard` with `@Roles('designer')`. Every service method is additionally scoped to the caller's own ID — a designer can only ever touch their own rows (wrong-owner access returns 403).

| Method | Path | Purpose |
|---|---|---|
| GET | `/dashboard/summary` | Cards, charts, recents, deadlines (7 parallel queries) |
| GET / PUT | `/profile` | Read / update designer profile (+ avatar URL) |
| GET | `/tasks` | Assigned tasks |
| PATCH | `/tasks/:id/status` | Move task (`open` / `in_progress` / `done`) |
| GET | `/submissions` | All submissions (with file counts) |
| POST | `/submissions` | Create draft + upload files (multipart, max 5) |
| GET / PUT | `/submissions/:id` | Detail (with files) / edit (locked once approved) |
| POST | `/submissions/:id/submit` | Submit draft (or resubmit after revision) |
| GET | `/submissions/:id/activity` | Status-change trail for one submission |
| GET | `/payments` | Payout history |
| GET / PUT | `/payments/method` | Bank payout details |
| GET | `/notifications` | Inbox feed |
| PUT | `/notifications/:id/read` | Mark one read |
| PUT | `/notifications/read-all` | Mark all read |
| GET / PUT | `/notifications/preferences` | Per-category toggles + digest |
| PUT | `/security/password` | Change password (bcrypt, verifies current first) |
| GET | `/image-to-code` | Code drafts for approved submissions |
| PUT | `/image-to-code/:id` | Save draft |
| POST | `/image-to-code/:id/submit` | Submit draft for review |

Designer **auth** (register, login, activate, forgot/reset password, invitations) lives in `src/auth/` (`AuthController` / `AuthService`), not here — this module assumes an authenticated designer.

---

## 3. Key data decisions (don't "fix" these without discussion)

- **Money is integer kobo** (`designer_payments.amount`). Frontend converts to ₦. Matches the existing `payments` convention.
- **Submission category is free text**, not an enum — the UI lets designers create custom categories; an enum would reject them.
- **One conversion per design** (`image_to_code.submission_id` is unique).
- **Name/email/phone/avatar live on `users`**, not duplicated into `designer_profiles` (bio, portfolio, specialties only).
- **Profile & preference rows auto-create** with defaults, so fresh accounts never 404.
- **Deletes cascade** from designer → their tasks/submissions/payments/notifications (except `assigned_by`, which is set-null so history survives staff deletion).

---

## 4. Rules the backend enforces

- Designers create drafts and read status. **Review transitions (under review / revision / approved) happen in the Admin panel** — approved/completed submissions and submitted/accepted code return 403 on edit.
- Profile email is read-only (verification implications).
- Uploads: images + PDF only, 10 MB each, max 5 files per submission (Multer disk storage in shared `uploads/`). The frontend mirrors these limits — keep them in sync.
- Unknown request fields are rejected (global validation pipe), so DTO shapes are exact.

---

## 5. Migrations — read this before touching the DB ⚠️

- **Deploys use `db:push`, not `db:migrate`** (`npm run db:push --workspace=apps/backend`, see `.github/workflows/deploy.yml`). Push diffs schema files against the live DB. The `migrations/` folder + journal are the versioned record, kept coherent for future `generate` runs.
- **Never run `db:push --force` casually.** Plain `db:push` asks for confirmation on risky changes; `--force` skips prompts. In Sept 2026 a `--force` would have auto-answered a **truncate question on `role_permissions`** (75 rows) — that constraint is deliberately unapplied until duplicates are reviewed.
- **History you should know:** two migrations were both numbered `0018` (upstream's `0018_conscious_katie_power` + designer `0018_mean_gateway`). The journal tracks upstream's; the designer delta was reconciled into `0020_past_johnny_storm`. Don't renumber old files.
- **Lesson learned (login 500, Sept 2026):** the login query selects *all* `users` columns. The merged schema added `deleted_at`, but production didn't have the column yet → every login 500'd. Fix was one additive `ADD COLUMN`. Rule: **whenever schema files gain a `users` column, confirm production has it before relying on it.**
- **Neon branching:** schema experiments go on a database branch (e.g. `designer test`), never the shared DB. Always fork a backup branch (e.g. `pre-<date>`) before applying anything to production.

---

## 6. How to add a new endpoint

1. Add the table/columns to a schema file in `database/schema/` (or reuse an existing table).
2. Add/extend a DTO in `designer/dto/` with `class-validator` decorators.
3. Add the service method in `designer.service.ts` — **scope every query to the caller's ID**.
4. Add the route in `designer.controller.ts` with `@ApiOperation` for Swagger.
5. Run `nest build` (backend) — must exit 0.
6. If the schema changed: `db:generate`, review the SQL, and follow section 5 for applying.
7. Tell the frontend owner the new path + shape (or update `designer-api.ts` yourself).

## 7. Troubleshooting

| Symptom | Likely cause |
|---|---|
| Login 500 `Failed query ... from "users"` | Connected DB is missing a `users` column the schema expects (see section 5). Check `information_schema.columns`. |
| `EADDRINUSE :::4000` | Stale backend still holds the port — kill it, don't start a second one. |
| Valid credentials → 401 | Backend is pointed at the wrong database (e.g. a branch without that user). Check which `DATABASE_URL` that terminal uses. |
| `Separate categories rejected` | Category sent as enum somewhere — it must stay free text end to end. |
