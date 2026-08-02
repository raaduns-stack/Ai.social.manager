# SocialPilot AI — Full-Stack Social Media Management Platform

An AI-driven social media management platform built for business clients, featuring automated content calendar generation, multi-tier subscription billing via Flutterwave, administrative oversight, and social channel management.

---

## 1. System Architecture & Tech Stack

This project is structured as a **npm workspace monorepo** separating backend APIs, frontend applications, and shared TypeScript type definitions.

| Layer | Technology | Primary Purpose |
| --- | --- | --- |
| **Backend API** | NestJS (Node.js / TypeScript) | Modular REST API, JWT authentication, RBAC guard enforcement, and Drizzle SQL aggregations |
| **Database & ORM** | PostgreSQL (Neon DB) + Drizzle ORM | Relational database, typed schema modeling, automated SQL migrations, and pgvector support |
| **Frontend App** | React 18 + Vite (SPA) | Single-Page Application for customer dashboard and internal staff administration |
| **Shared Types** | `@socialpilot/shared-types` | Monorepo workspace package guaranteeing compile-time type safety between frontend and backend |
| **Styling & UI** | Tailwind CSS + Lucide Icons | Utility-first styling with centralized design tokens and reusable UI primitives |
| **Payments** | Flutterwave API + Webhooks | Plan checkout, payment verification, subscription activation, and automated invoice records |

---

## 2. Monorepo File Structure

```text
Ai.social.manager/
├── apps/
│   ├── backend/                    # NestJS API Server (Port 4000)
│   │   ├── src/
│   │   │   ├── admin/              # Admin dashboard metrics & staff endpoints
│   │   │   ├── auth/               # JWT authentication, RBAC guards, strategies
│   │   │   ├── common/             # Global HTTP exception filters, logging, UserRole enum
│   │   │   ├── config/             # Type-safe environment variable validation
│   │   │   ├── database/           # Drizzle schema (users, plans, subscriptions, payments, social_accounts)
│   │   │   ├── invoices/           # Invoice billing records CRUD
│   │   │   ├── payments/           # Flutterwave checkout initialization & webhook verification
│   │   │   ├── plans/              # Subscription tier pricing & feature definitions
│   │   │   └── social-accounts/    # Channels Stage 1 CRUD (platform linking)
│   │   └── package.json
│   │
│   └── frontend/                   # React + Vite Client (Port 5173)
│       ├── src/
│       │   ├── components/         # Reusable primitives (ui, layout, charts, staff)
│       │   ├── context/            # AuthContext (customer) & AdminAuthContext (staff)
│       │   ├── features/           # Modular API client services (auth, dashboard, channels, billing)
│       │   ├── layouts/            # Page shells (DashboardLayout, AdminLayout, AuthLayout)
│       │   ├── lib/                # Central Axios API client with token interceptors
│       │   ├── pages/              # Customer Dashboard & Admin Panel views
│       │   ├── routes/             # AppRoutes.jsx & AdminRoutes.jsx
│       │   └── utils/              # Tailwind class merge helper (cn.js) & shared constants
│       └── package.json
│
├── packages/
│   └── shared-types/               # Shared TypeScript interfaces (User, Plan, Subscription, SocialAccount)
│       ├── src/
│       └── package.json
│
├── docs/                           # Team workflow, theme specs, and architectural review docs
├── package.json                    # Root workspace configuration
└── README.md                       # System documentation

```

---

## 3. Getting Started & Installation

### Step 1: Clone & Workspace Installation

From the root of the project, run a single `npm install` command. Because this project uses npm workspaces, this automatically installs dependencies for `apps/backend`, `apps/frontend`, and `packages/shared-types` simultaneously:

```bash
git clone <your-repository-url>
cd Ai.social.manager
npm install

```

### Step 2: Environment Variable Configuration

Each developer must use their own isolated environment variables and Neon PostgreSQL database instance. **Never commit `.env` files to version control.**

1. Copy the backend environment template:
```bash
cp apps/backend/.env.example apps/backend/.env

```


2. Copy the frontend environment template:
```bash
cp apps/frontend/.env.example apps/frontend/.env

```



#### Required Backend Variables (`apps/backend/.env`)

| Variable | Description | Example Value |
| --- | --- | --- |
| `PORT` | Local API server listening port | `4000` |
| `DATABASE_URL` | Your isolated Neon PostgreSQL connection string | `postgresql://user:password@ep-sample.neon.tech/neondb` |
| `JWT_SECRET` | Secret key used to sign access tokens | `your_secure_random_hex_string` |
| `JWT_REFRESH_SECRET` | Secret key used to sign refresh tokens | `another_secure_random_hex_string` |
| `FLUTTERWAVE_SECRET_KEY` | Flutterwave API key for transaction initialization | `FLWSECK_TEST-xxxxxxxxxxxx` |
| `FLUTTERWAVE_WEBHOOK_SECRET_HASH` | String matched against incoming webhook `verif-hash` | `your_custom_webhook_secret_hash` |

#### Required Frontend Variables (`apps/frontend/.env`)

| Variable | Description | Example Value |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Full HTTP base URL pointing to the NestJS server | `http://localhost:4000/api` |

---

## 4. Database Schema & Migrations

All database modifications are managed through **Drizzle ORM**. Do not manually add columns or modify tables in database GUIs (e.g., pgAdmin or Drizzle Studio).

Whenever you modify a schema file inside `apps/backend/src/database/schema/`:

1. **Generate the SQL migration file:**
```bash
npm run db:generate --workspace=apps/backend

```


2. **Apply the migration to your Neon PostgreSQL database:**
```bash
npm run db:migrate --workspace=apps/backend

```



> **Note:** Whenever you add a new foreign key reference or table, ensure `apps/backend/src/database/schema/relations.ts` is updated so Drizzle's relational queries (`.findMany({ with: { ... } })`) compile correctly.

---

## 5. Running the Application Locally

You can run both the frontend and backend servers concurrently during local development.

### Start the NestJS Backend API (Port 4000)

```bash
npm run dev --workspace=apps/backend

```

* **API Base URL:** `http://localhost:4000/api`
* **Swagger Interactive Documentation:** `http://localhost:4000/api/docs`

### Start the Vite + React Frontend SPA (Port 5173)

```bash
npm run dev --workspace=apps/frontend

```

* **Customer & Admin Portal:** Open `http://localhost:5173` in your browser.

---

## 6. Authentication & 5-Role RBAC System

Security permissions are governed by a single source of truth defined in `apps/backend/src/common/enums/roles.enum.ts` and mirrored on the frontend.

| Role | Scope | Key Permissions & Restrictions |
| --- | --- | --- |
| `user` | Customer Portal | Own dashboard, subscription billing, channels, and content calendar |
| `super_admin` | Admin Panel | Full access: platform revenue, staff accounts, RBAC changes, system settings |
| `account_manager` | Admin Panel | Support operations: view customer accounts, subscriptions, troubleshoot channels |
| `reviewer` | Admin Panel | Quality control: review and approve scheduled AI posts before publishing |
| `designer` | Admin Panel | Visual media: manage post design templates and platform media libraries |

---

## 7. Current Backend Integration Status

| Feature Module | Active Data Source | Status | Notes |
| --- | --- | --- | --- |
| **Auth & RBAC Guards** | Live Drizzle DB + JWT | **Real** | Single-table RBAC; staff roles promoted via UI |
| **Plans & Pricing** | `/api/plans` | **Real** | Dynamic pricing cards and features table |
| **Billing & Subscriptions** | `/api/subscription` | **Real** | Free-tier default; Flutterwave verification |
| **Invoices** | `/api/invoice` | **Real** | Auto-generated on successful payment verify |
| **Customer Dashboard Summary** | `/api/dashboard/my-summary` | **Real** | Returns live plan and activation status |
| **Admin KPIs (Customers, Revenue)** | `/api/admin/dashboard-summary` | **Real** | Role-restricted SQL aggregation (`COUNT`, `SUM`) |
| **Social Channels (Stage 1)** | `/api/social-accounts` | **Real** | CRUD connection records & admin audit table |
| **Engagement & Follower Stats** | Static Placeholder | **Mock** | Blocked until Channels Stage 2 (OAuth) is live |
| **Published Posts & Calendar** | Static Placeholder | **Mock** | Blocked until CTO confirms admin-review gate |
| **AI Content & Suggestion Stats** | Static Placeholder | **Mock** | Awaiting AI generation engine integration |

---

## 8. Architectural Rigor & Supporting Documentation

Our engineering decisions, workflow guidelines, and architectural blueprints are documented across the repository:

* **`docs/GIT_WORKFLOW.md`**: Outlines our feature-branching strategy, commit message standards, and merge-conflict resolution protocols for shared foundation files (`app.module.ts`, `relations.ts`, `roles.enum.ts`).
* **`docs/ADMIN_THEME.md`**: Comprehensive design tokens, visual hierarchy, and UI component standards for the Admin Panel.
* **`Dashboard-and-Channels-Integration-Guide.md`**: Contains the full architectural specification and schema contracts for the Dashboard summary endpoints and Channels Stage 1 CRUD pipeline prior to implementation.
* **`Frontend-Architecture-Review.md`**: Reconciles the frontend routing structure (`AppRoutes.jsx`, `AdminRoutes.jsx`) against the backend API coverage, documenting how we resolved free-tier auto-assignment and onboarding sequences.

---

## 9. Design System & Frontend Design Tokens

All UI styling must adhere strictly to the design system configured in `apps/frontend/tailwind.config.js`. Avoid hardcoding raw hex values in JSX.

| Token Name | Color Value | Tailwind Utility Class | Usage |
| --- | --- | --- | --- |
| **Primary** | `#4F46E5` | `bg-primary`, `text-primary` | Main call-to-action buttons, active navigation states |
| **Accent / Success** | `#10B981` | `bg-accent`, `text-accent` | Positive status badges, successful payment confirmations |
| **Warning** | `#F59E0B` | `bg-warning`, `text-warning` | Pending statuses, expiration warnings |
| **Danger** | `#EF4444` | `bg-danger`, `text-danger` | Destructive actions, payment failures, disconnect alerts |
| **Card Radius** | `12px` | `rounded-card` | Container cards, modals, tables |
| **Control Radius** | `8px` | `rounded-control` | Inputs, buttons, form controls |
