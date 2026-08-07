# Module Map

Quick lookup for "where do I find X" — scan this before grepping the whole repo. This doc is
part of "done" for any PR that adds a new module: update this table, not just the code.

## Backend — Auth, RBAC & Access Control

| Looking for... | Go to |
|---|---|
| Login / register / email verification logic | `apps/backend/src/auth/auth.controller.ts`, `auth.service.ts` |
| JWT strategy / how tokens are validated | `apps/backend/src/auth/strategies/jwt.strategy.ts` |
| Route protection (require login) | `apps/backend/src/auth/guards/jwt-auth.guard.ts` |
| Role-based access control (who can do what) | `apps/backend/src/auth/guards/roles.guard.ts` + `apps/backend/src/auth/decorators/roles.decorator.ts` |
| Plan-tier gating (Growth/Enterprise-only features) | `apps/backend/src/auth/guards/plan-tiers.guard.ts` + `apps/backend/src/auth/decorators/plan-tiers.decorator.ts` |
| The 5 role definitions (super_admin, account_manager, etc.) | `apps/backend/src/common/enums/roles.enum.ts` |
| "Who is the current logged-in user" in a controller | `apps/backend/src/auth/decorators/current-user.decorator.ts` |

## Backend — Support & Tickets

| Looking for... | Go to |
|---|---|
| Ticket assignment logic (who can assign to whom) | `apps/backend/src/support/support.service.ts`, `support.controller.ts` |
| Ticket assignment DTO/validation | `apps/backend/src/support/dto/assign-ticket.dto.ts` |
| Ticket creation / status update DTOs | `apps/backend/src/support/dto/create-ticket.dto.ts`, `update-ticket-status.dto.ts` |
| Ticket messages/replies | `apps/backend/src/support/dto/create-message.dto.ts` |
| Auto-close (72h resolved-inactivity) job | `apps/backend/src/support/jobs/auto-close-tickets.job.ts` |
| Admin-facing support routes (staff inbox view) | `apps/backend/src/admin/support/admin-support.controller.ts` — should delegate to `support.service.ts`, not duplicate logic |
| Support module overview | `apps/backend/src/support/README.md` |
| WhatsApp link gating (Growth/Enterprise only) | `apps/backend/src/support/support.controller.ts` (uses `PlanTiersGuard`) |
| FAQs (support knowledge base, customer-facing) | `apps/backend/src/faqs/faqs.controller.ts` |
| FAQs admin management (create/edit) | `apps/backend/src/faqs/faqs-admin.controller.ts` |

## Backend — Billing & Plans

| Looking for... | Go to |
|---|---|
| Plan pricing/features definitions | `apps/backend/src/plans/plans.service.ts` |
| Active subscription for a user | `apps/backend/src/subscriptions/subscriptions.service.ts` |
| Flutterwave checkout initialization | `apps/backend/src/payments/payments.service.ts`, `dto/initialize-payment.dto.ts` |
| Invoice records | `apps/backend/src/invoices/invoices.service.ts` |

## Backend — Content, AI & Channels

| Looking for... | Go to |
|---|---|
| AI caption/idea generation | `apps/backend/src/content-suggestions/content-suggestions.service.ts` |
| Content feedback (thumbs up/down on AI output) | `apps/backend/src/content-suggestions/dto/create-feedback.dto.ts` |
| AI prompt templates (admin-configurable) | `apps/backend/src/admin/prompt-management/prompt-management.service.ts` |
| Connected social accounts (Instagram, etc.) | `apps/backend/src/social-accounts/social-accounts.service.ts` |
| File/image uploads | `apps/backend/src/uploads/uploads.service.ts`, `uploads.controller.ts` |
| Where uploaded files are actually stored on disk | `apps/backend/uploads/` (local dev only — confirm production storage strategy separately, this won't persist across most host deploys) |

## Backend — Admin & Dashboards

| Looking for... | Go to |
|---|---|
| Admin-wide KPIs (revenue, customer counts) | `apps/backend/src/admin/dashboard.controller.ts` *(consider renaming to `admin-dashboard.controller.ts` — see folder cleanup notes)* |
| Customer's own dashboard summary | `apps/backend/src/dashboard/dashboard.controller.ts` |
| Staff account management | `apps/backend/src/admin/admin.controller.ts`, `admin.service.ts` |
| Global HTTP error formatting | `apps/backend/src/common/filters/http-exception.filter.ts` |
| Request logging | `apps/backend/src/common/interceptors/logging.interceptor.ts` |

## Backend — Database

| Looking for... | Go to |
|---|---|
| All table schemas (single source of truth) | `apps/backend/src/database/schema/` — one file per table, e.g. `support-tickets.schema.ts`, `users.schema.ts` |
| Table relationships (joins) | `apps/backend/src/database/schema/relations.ts` |
| Schema barrel export | `apps/backend/src/database/schema/index.ts` |
| Migration files (generated, don't hand-edit) | `apps/backend/src/database/migrations/` |
| DB connection/module setup | `apps/backend/src/database/database.module.ts` |
| Env var validation (DATABASE_URL, JWT secrets, etc.) | `apps/backend/src/config/env.validation.ts` |

## Frontend — Pages by Audience

| Looking for... | Go to |
|---|---|
| Customer-facing pages (dashboard, billing, support, uploads) | `apps/frontend/src/pages/Dashboard/` |
| Admin/staff pages (KPIs, staff management, audit logs) | `apps/frontend/src/pages/Admin/` |
| Staff role/permission management UI | `apps/frontend/src/pages/Admin/staff/RolesPermissions.jsx` |
| Staff activity/login history | `apps/frontend/src/pages/Admin/staff/ActivityLogs.jsx`, `LoginHistory.jsx` |
| Onboarding flow (signup → plan → payment → connect accounts) | `apps/frontend/src/pages/Onboarding/` |
| Public marketing pages (landing, pricing, contact) | `apps/frontend/src/pages/Landing.jsx`, `Pricing.jsx`, `Contact.jsx` |
| Login/signup/password reset | `apps/frontend/src/pages/Auth/` |

## Frontend — API Clients, State & Routing

| Looking for... | Go to |
|---|---|
| API call for a given domain (e.g. support, uploads, plans) | `apps/frontend/src/features/<domain>/<domain>-api.ts` |
| Central axios client / token attachment | `apps/frontend/src/lib/api-client.ts` |
| Logged-in customer auth state | `apps/frontend/src/context/AuthContext.jsx`, `useAuth.js` |
| Logged-in staff/admin auth state | `apps/frontend/src/context/AdminAuthContext.jsx`, `useAdminAuth.js` |
| Route definitions (customer app) | `apps/frontend/src/routes/AppRoutes.jsx` |
| Route definitions (admin panel) | `apps/frontend/src/routes/AdminRoutes.jsx` |
| Route guards (require admin login / require specific role) | `apps/frontend/src/routes/RequireAdminAuth.jsx`, `RequireAdminRoles.jsx` |
| Global auth store | `apps/frontend/src/store/auth-store.ts` |

## Frontend — Shared UI

| Looking for... | Go to |
|---|---|
| Generic UI primitives (buttons, modals, tables) | `apps/frontend/src/components/ui/` |
| Page shells (sidebar/nav wrapper per section) | `apps/frontend/src/layouts/` — `AdminLayout.jsx`, `DashboardLayout.jsx`, `AuthLayout.jsx`, `OnboardingLayout.jsx` |
| Nav bars / sidebars | `apps/frontend/src/components/layout/` |
| Support ticket thread UI | `apps/frontend/src/components/ui/TicketThread.jsx` |
| Staff-specific components (role badges, logs) | `apps/frontend/src/components/staff/` |
| Design tokens (colors, radii — never hardcode hex) | `apps/frontend/tailwind.config.js` |

## Shared Types & Config

| Looking for... | Go to |
|---|---|
| Shared TypeScript interfaces across frontend/backend | `packages/shared-types/index.ts` *(verify this is the canonical one in use — see folder cleanup notes; `packages/types` may be a duplicate/unused)* |
| Git workflow / branching / commit conventions | `docs/GIT_WORKFLOW.md` |
| Admin panel design system spec | `docs/ADMIN_THEME.md` |

---

**Maintenance rule:** any PR that adds a new backend module or a new top-level frontend page
must add a row here in the same PR. A stale map is worse than no map — treat this update as
part of the definition of "done," per `docs/GIT_WORKFLOW.md`.
