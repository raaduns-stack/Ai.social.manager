# Designer Portal (Frontend)

The **Designer Portal** (`/designer/*`) is the workspace for graphic designers: tasks, design submissions, image-to-code drafts, earnings, notifications, settings. It is fully isolated from the customer portal (`/dashboard/*`) and the admin panel (`/admin/*`) — separate routes, separate auth session, separate API surface.

> Companion doc: `apps/backend/src/designer/README.md` (the API side).

---

## 1. Route map (`src/routes/DesignerRoutes.jsx`)

Public (outside the app shell): `register` · `login` · `verify-email` · `activate` · `forgot-password` · `reset-password`

Protected (inside `DesignerLayout`, behind `RequireDesignerAuth`):

| Path | Page file | What it shows |
|---|---|---|
| `/designer/` | `Dashboard.jsx` | Earnings, approval rate, recents, deadlines, quick actions |
| `/designer/tasks` | `Tasks.jsx` | Assigned briefs (table + board) |
| `/designer/submissions` | `Submissions.jsx` | Uploads, status tracking, activity history, detail modal |
| `/designer/image-to-code` | `ImageToCode.jsx` | Code drafts for approved designs (editor + preview modal) |
| `/designer/payments` | `Payments.jsx` | Payout history, method, CSV statement |
| `/designer/notifications` | `Notifications.jsx` | Inbox feed, read/unread |
| `/designer/settings` | `Settings.jsx` | Profile · Account · Notifications · Security tabs |
| `/designer/activity` | — | Redirects to `submissions` (no separate calendar — by design) |

---

## 2. Folder map

```
src/pages/Designer/            ← pages (this folder)
├── Auth/                      ← login, register, verify, activate, forgot, reset
├── Dashboard.jsx  Tasks.jsx  Submissions.jsx  ImageToCode.jsx
├── Payments.jsx  Notifications.jsx  Settings.jsx
src/components/designer/       ← portal components (DesignerUploadModal, ImageToCodeModal)
src/components/designer/premium/ ← premium UI kit (PremiumCard, CoverImage, StatusDot, TimelineStepper, …)
src/components/layout/         ← DesignerNavbar, DesignerSidebar
src/layouts/DesignerLayout.jsx ← shell (sidebar + navbar + content, premium CSS scope)
src/routes/DesignerRoutes.jsx  ← route table + guards
src/routes/RequireDesignerAuth.jsx ← auth guard (spinner while loading)
src/context/DesignerAuthContext.jsx ← session state (login/register/logout/activate)
src/features/designer/         ← API layer (the only place that calls the backend)
├── designer-api.ts            ← ~20 thin functions, one per endpoint group
├── designer-types.ts          ← request/response interfaces
└── format.ts                  ← naira(), nairaShort(), timeAgo(), formatDue(), resolveFileUrl()
src/styles/designer-premium.css ← orange premium theme, scoped to the portal
```

---

## 3. Auth flow

`register → verify email → login` (self-service, link from landing page). Invited designers arrive via email link → `activate` (sets password, consumes invitation). `DesignerAuthContext` stores the session under `designer_session` (separate key from customer/admin sessions) and rejects non-designer roles at login.

Password reset is neutral (always shows "check your email") so accounts can't be enumerated.

## 4. API layer rules

- **All backend calls go through `features/designer/designer-api.ts`.** Pages never call HTTP directly.
- Amounts arrive in **kobo** — always render with `naira()` / `nairaShort()`. Never hardcode `₦` figures.
- File URLs (`/uploads/…`) go through `resolveFileUrl()` to reach the API origin.
- Uploads post `FormData` (`createSubmission`). Limits must match the backend: **5 files, 10 MB each, images + PDF**.
- Every page handles loading / error / empty states — no mock data, no fake `setTimeout` submits.

## 5. Lifecycles you must respect

**Submissions:** `draft → submitted → received → under_review → revision_required → resubmitted → approved → completed`
Only `draft` and `revision_required` can be edited or (re)submitted from here. Approved/completed are locked (the backend 403s edits) — render them read-only. Review actions themselves live in the Admin panel, never here.

**Image-to-code:** `draft → submitted → revision_required → accepted`. Submitted code is read-only, same reason.

**Submission categories** (General Graphics · Hospitality · Other) show **contextual hint text only** — they never change fields or validation.

## 6. Design system (abridged)

The portal has its own premium skin (orange `#FF6600`, Plus Jakarta Sans display, `designer-premium.css` scope) while shared tokens follow the admin spec: ink `#111827`, muted `#6B7280`, border `#E5E7EB`, canvas `#F9FAFB`, radius 12px cards / 8px controls.

- Status badges: approved/verified → `bg-emerald-100 text-emerald-700` · pending → `bg-amber-100 text-amber-700` · rejected → `bg-red-100 text-red-700` · neutral/closed → `bg-gray-100 text-gray-700`
- Buttons: primary `bg-[#4F46E5] text-white px-4 py-2 rounded-lg` (designer CTAs may use the premium orange within the portal scope) · all `text-sm font-medium`
- Cards: `rounded-card border border-[#E5E7EB] bg-white p-5`, flat 1px border, no resting shadow
- Lists go through `DataTable.jsx` · icons are Lucide only · page padding `p-6`, vertical rhythm `space-y-6`

## 7. Backend contract (page → endpoint)

Dashboard → `GET designer/dashboard/summary` · Tasks → `GET/PATCH designer/tasks` · Submissions → `GET/POST/PUT designer/submissions…` · Payments → `GET/PUT designer/payments…` · Notifications → `GET/PUT designer/notifications…` · Settings → `PUT designer/profile`, `PUT designer/notifications/preferences`, `PUT designer/security/password` · Image-to-Code → `GET/PUT/POST designer/image-to-code…`. Full table in the backend README.

## 8. How to add a page / wire an endpoint

1. Add the route in `DesignerRoutes.jsx` (protected section) + nav item in `DesignerSidebar.jsx`.
2. Add the API function + types in `features/designer/`.
3. Build the page with `PageHeader` + `PremiumCard`, loading/error/empty states, `format.ts` helpers.
4. Keep upload/category/money conventions in sections 4–5.

## 9. Troubleshooting

| Symptom | Likely cause |
|---|---|
| "Connection error" on login | Backend isn't running (`ERR_CONNECTION_REFUSED`) — start it, wait ~3 min for boot. |
| Login 500 | Backend's DB is missing a column (schema drift) — backend README section 5/7. |
| Correct credentials → 401 | Backend is pointed at the wrong database branch (stale `DATABASE_URL` override in that terminal). |
| Blank page behind `/designer/*` | Auth guard still loading — check `RequireDesignerAuth` + session key. |
| Stale UI after pulling | Old dev servers still running pre-pull code — kill all `node` dev processes, restart both apps. |
| `dist/main` missing crash-loop | Stale `nest --watch` state after a branch switch — kill it, rebuild, restart. |

## 10. Out of scope (don't build these here)

Reviewer approve/reject actions (admin panel) · payout money movement (records only) · image-to-code conversion pipeline (UI + drafts only) · activity calendar (activity lives inside Submissions) · org-created accounts (self-service auth only).
